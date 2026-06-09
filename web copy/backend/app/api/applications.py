from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user
from app.models.schemas import ApplicationCreate, ApplicationUpdate, UserInfo
from app.db.supabase import get_service_client

router = APIRouter(prefix="/applications", tags=["applications"])

STATUS_ORDER = ["bookmarked", "applied", "interview", "offer", "rejected", "withdrawn"]


@router.get("/")
async def list_applications(
    status: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    query = (
        client.table("applications")
        .select("*, job_postings(id,title,company,company_logo_url,location,url,source)")
        .eq("user_id", str(user.id))
        .order("updated_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    resp = query.execute()
    return resp.data or []


@router.post("/")
async def create_application(body: ApplicationCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    data = body.model_dump()
    data["user_id"] = str(user.id)
    if data.get("job_posting_id"):
        data["job_posting_id"] = str(data["job_posting_id"])

        if not data.get("company_name") or not data.get("role_title"):
            job_resp = client.table("job_postings").select("title,company,url").eq("id", data["job_posting_id"]).single().execute()
            if job_resp.data:
                data["company_name"] = data.get("company_name") or job_resp.data.get("company")
                data["role_title"] = data.get("role_title") or job_resp.data.get("title")
                data["source_url"] = data.get("source_url") or job_resp.data.get("url")

    resp = client.table("applications").insert(data).execute()
    return resp.data[0] if resp.data else {}


@router.get("/stats")
async def get_application_stats(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = client.table("applications").select("status").eq("user_id", str(user.id)).execute()
    apps = resp.data or []

    counts = {s: 0 for s in STATUS_ORDER}
    for app in apps:
        s = app.get("status", "bookmarked")
        if s in counts:
            counts[s] += 1

    return {
        "total": len(apps),
        "by_status": counts,
        "active": counts["applied"] + counts["interview"],
        "success_rate": round(counts["offer"] / len(apps) * 100, 1) if apps else 0,
    }


@router.get("/{app_id}")
async def get_application(app_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = (
        client.table("applications")
        .select("*, job_postings(*)")
        .eq("id", str(app_id))
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn ứng tuyển")
    return resp.data


@router.patch("/{app_id}")
async def update_application(
    app_id: UUID,
    body: ApplicationUpdate,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=422, detail="Không có dữ liệu cập nhật")
    for key in ("cv_id", "cover_letter_id"):
        if update_data.get(key):
            update_data[key] = str(update_data[key])
    resp = (
        client.table("applications")
        .update(update_data)
        .eq("id", str(app_id))
        .eq("user_id", str(user.id))
        .execute()
    )
    return resp.data[0] if resp.data else {}


@router.delete("/{app_id}")
async def delete_application(app_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    client.table("applications").delete().eq("id", str(app_id)).eq("user_id", str(user.id)).execute()
    return {"ok": True}
