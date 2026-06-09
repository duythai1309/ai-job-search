from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.deps import get_current_user
from app.models.schemas import FitEvaluation, JobPostingOut, UserInfo
from app.db.supabase import get_service_client
from app.services import gemini, job_scraper

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/search")
async def search_jobs(
    q: str = Query(default="", description="Từ khóa tìm kiếm"),
    location: str = Query(default=""),
    sources: str = Query(default="", description="Comma-separated: vietnamworks,topcv,itviec,careerviet"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    user: UserInfo = Depends(get_current_user),
):
    source_list = [s.strip() for s in sources.split(",") if s.strip()] or None
    jobs = await job_scraper.search_jobs(q, location, source_list, page, limit)
    return {"jobs": jobs, "total": len(jobs), "page": page}


@router.get("/saved")
async def get_saved_jobs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    offset = (page - 1) * limit
    resp = (
        client.table("job_postings")
        .select("*")
        .eq("is_active", True)
        .order("scraped_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"jobs": resp.data or [], "page": page}


@router.get("/{job_id}")
async def get_job(
    job_id: UUID,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    resp = client.table("job_postings").select("*").eq("id", str(job_id)).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy việc làm")
    return resp.data


@router.post("/{job_id}/evaluate-fit")
async def evaluate_job_fit(
    job_id: UUID,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()

    job_resp = client.table("job_postings").select("*").eq("id", str(job_id)).single().execute()
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

    evaluation = await gemini.evaluate_fit(
        job_title=job.get("title", ""),
        job_description=job.get("description", "") or "",
        job_requirements=job.get("requirements", []),
        skills_required=job.get("skills_required", []),
        user_profile=user_profile,
    )

    client.table("seen_jobs").upsert(
        {"user_id": str(user.id), "job_posting_id": str(job_id)},
        on_conflict="user_id,job_posting_id",
    ).execute()

    return evaluation


@router.post("/{job_id}/mark-seen")
async def mark_job_seen(
    job_id: UUID,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    client.table("seen_jobs").upsert(
        {"user_id": str(user.id), "job_posting_id": str(job_id)},
        on_conflict="user_id,job_posting_id",
    ).execute()
    return {"ok": True}
