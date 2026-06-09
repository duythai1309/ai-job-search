from __future__ import annotations
import io
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.deps import get_current_user
from app.models.schemas import CVCreate, CVUpdate, ApplySuggestionRequest, GenerateCoverLetterRequest, UserInfo
from app.db.supabase import get_service_client
from app.services import gemini, cv_service, pdf_service

router = APIRouter(prefix="/cv", tags=["cv"])


@router.get("/")
async def list_cvs(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = (
        client.table("cvs")
        .select("id,title,target_role,target_company,is_master,version,created_at,updated_at")
        .eq("user_id", str(user.id))
        .order("updated_at", desc=True)
        .execute()
    )
    return resp.data or []


@router.post("/")
async def create_cv(body: CVCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    profile_resp = client.table("profiles").select("*").eq("id", str(user.id)).single().execute()
    edu_resp = client.table("education").select("*").eq("user_id", str(user.id)).execute()
    exp_resp = client.table("experience").select("*").eq("user_id", str(user.id)).execute()
    skills_resp = client.table("skills").select("*").eq("user_id", str(user.id)).execute()

    profile = profile_resp.data or {}
    profile["education"] = edu_resp.data or []
    profile["experience"] = exp_resp.data or []
    profile["skills"] = skills_resp.data or []

    cv_data = body.model_dump()
    cv_data["user_id"] = str(user.id)
    cv_data["sections"] = [s.model_dump() for s in body.sections]
    html = cv_service.build_cv_html(cv_data, profile)
    cv_data["html_content"] = html

    resp = client.table("cvs").insert(cv_data).execute()
    return resp.data[0] if resp.data else {}


@router.get("/{cv_id}")
async def get_cv(cv_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = (
        client.table("cvs")
        .select("*")
        .eq("id", str(cv_id))
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy CV")
    return resp.data


@router.patch("/{cv_id}")
async def update_cv(cv_id: UUID, body: CVUpdate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    existing = (
        client.table("cvs")
        .select("*")
        .eq("id", str(cv_id))
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy CV")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if "sections" in update_data:
        update_data["sections"] = [s.model_dump() if hasattr(s, "model_dump") else s for s in update_data["sections"]]

    merged = {**existing.data, **update_data}
    profile_resp = client.table("profiles").select("*").eq("id", str(user.id)).single().execute()
    html = cv_service.build_cv_html(merged, profile_resp.data or {})
    update_data["html_content"] = html

    resp = client.table("cvs").update(update_data).eq("id", str(cv_id)).execute()
    return resp.data[0] if resp.data else {}


@router.delete("/{cv_id}")
async def delete_cv(cv_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    client.table("cvs").delete().eq("id", str(cv_id)).eq("user_id", str(user.id)).execute()
    return {"ok": True}


@router.get("/{cv_id}/pdf")
async def download_cv_pdf(cv_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = (
        client.table("cvs")
        .select("html_content,title")
        .eq("id", str(cv_id))
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data or not resp.data.get("html_content"):
        raise HTTPException(status_code=404, detail="Không tìm thấy CV")

    pdf_bytes = pdf_service.html_to_pdf(resp.data["html_content"])
    filename = (resp.data.get("title") or "cv").replace(" ", "_") + ".pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{cv_id}/analyze")
async def analyze_cv(
    cv_id: UUID,
    job_posting_id: Optional[UUID] = Query(default=None),
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    cv_resp = (
        client.table("cvs")
        .select("*")
        .eq("id", str(cv_id))
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not cv_resp.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy CV")
    cv = cv_resp.data

    job_description = None
    job_requirements = None
    if job_posting_id:
        job_resp = client.table("job_postings").select("description,requirements").eq("id", str(job_posting_id)).single().execute()
        if job_resp.data:
            job_description = job_resp.data.get("description")
            job_requirements = job_resp.data.get("requirements")

    suggestions = await gemini.analyze_cv_sections(
        cv_sections=cv.get("sections", []),
        job_description=job_description,
        job_requirements=job_requirements,
    )

    client.table("cv_suggestions").delete().eq("cv_id", str(cv_id)).eq("user_id", str(user.id)).execute()

    if suggestions:
        records = [
            {
                **s,
                "cv_id": str(cv_id),
                "user_id": str(user.id),
                "job_posting_id": str(job_posting_id) if job_posting_id else None,
            }
            for s in suggestions
        ]
        client.table("cv_suggestions").insert(records).execute()

    return {"suggestions": suggestions}


@router.get("/{cv_id}/suggestions")
async def get_cv_suggestions(cv_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = (
        client.table("cv_suggestions")
        .select("*")
        .eq("cv_id", str(cv_id))
        .eq("user_id", str(user.id))
        .eq("is_applied", False)
        .execute()
    )
    return resp.data or []


@router.post("/{cv_id}/suggestions/apply")
async def apply_suggestions(
    cv_id: UUID,
    body: ApplySuggestionRequest,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    for sid in body.suggestion_ids:
        client.table("cv_suggestions").update({"is_applied": True}).eq("id", str(sid)).eq("user_id", str(user.id)).execute()
    return {"applied": len(body.suggestion_ids)}


@router.post("/cover-letter/generate")
async def generate_cover_letter(
    body: GenerateCoverLetterRequest,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    job_resp = client.table("job_postings").select("*").eq("id", str(body.job_posting_id)).single().execute()
    if not job_resp.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy việc làm")
    job = job_resp.data

    profile_resp = client.table("profiles").select("*").eq("id", str(user.id)).single().execute()
    edu_resp = client.table("education").select("*").eq("user_id", str(user.id)).execute()
    exp_resp = client.table("experience").select("*").eq("user_id", str(user.id)).execute()
    skills_resp = client.table("skills").select("*").eq("user_id", str(user.id)).execute()

    user_profile = {
        **(profile_resp.data or {}),
        "education": edu_resp.data or [],
        "experience": exp_resp.data or [],
        "skills": skills_resp.data or [],
    }

    content = await gemini.generate_cover_letter(
        job_title=job.get("title", ""),
        company=job.get("company", ""),
        job_description=job.get("description", "") or "",
        user_profile=user_profile,
        language=body.language,
        tone=body.tone,
    )

    profile = profile_resp.data or {}
    html = cv_service.build_cover_letter_html(
        content=content,
        sender_name=profile.get("full_name", ""),
        sender_email=profile.get("email", ""),
        sender_phone=profile.get("phone", ""),
        recipient_name="",
        company=job.get("company", ""),
        role=job.get("title", ""),
    )

    cl_resp = client.table("cover_letters").insert({
        "user_id": str(user.id),
        "job_posting_id": str(body.job_posting_id),
        "title": f"Thư xin việc – {job.get('title')} tại {job.get('company')}",
        "content": content,
        "html_content": html,
        "language": body.language,
    }).execute()

    return cl_resp.data[0] if cl_resp.data else {"content": content, "html_content": html}
