from __future__ import annotations
from datetime import date

from fastapi import APIRouter, Depends, Query

from app.deps import get_current_user
from app.models.schemas import UserInfo
from app.db.supabase import get_service_client
from app.services import gemini

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/market")
async def get_market_analytics(
    category: str = Query(default=""),
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    query = (
        client.table("market_analytics")
        .select("*")
        .order("date", desc=True)
        .limit(10)
    )
    if category:
        query = query.eq("category", category)
    resp = query.execute()
    return resp.data or []


@router.post("/market/refresh")
async def refresh_market_analytics(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    jobs_resp = (
        client.table("job_postings")
        .select("title,company,location,employment_type,salary_min,salary_max,skills_required,source")
        .eq("is_active", True)
        .limit(200)
        .execute()
    )
    jobs = jobs_resp.data or []
    if not jobs:
        return {"message": "Không có dữ liệu việc làm để phân tích"}

    insights = await gemini.generate_market_insights(jobs)
    today = date.today().isoformat()

    records = [
        {"category": k, "data": v, "date": today, "period": "weekly", "source": "ai_analysis"}
        for k, v in insights.items()
        if isinstance(v, (list, dict))
    ]
    if records:
        client.table("market_analytics").upsert(records, on_conflict="category,date").execute()

    return insights


@router.get("/jobs/summary")
async def get_jobs_summary(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    total = client.table("job_postings").select("id", count="exact").eq("is_active", True).execute()
    by_source = client.table("job_postings").select("source", count="exact").eq("is_active", True).execute()

    source_counts: dict[str, int] = {}
    for row in (by_source.data or []):
        s = row.get("source", "other")
        source_counts[s] = source_counts.get(s, 0) + 1

    return {
        "total_jobs": total.count or 0,
        "by_source": source_counts,
    }


@router.get("/user/activity")
async def get_user_activity(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    apps_resp = client.table("applications").select("status,created_at,fit_score").eq("user_id", str(user.id)).execute()
    apps = apps_resp.data or []

    seen_resp = client.table("seen_jobs").select("seen_at", count="exact").eq("user_id", str(user.id)).execute()
    cv_resp = client.table("cvs").select("id", count="exact").eq("user_id", str(user.id)).execute()

    status_counts: dict[str, int] = {}
    for app in apps:
        s = app.get("status", "bookmarked")
        status_counts[s] = status_counts.get(s, 0) + 1

    avg_fit = (
        sum(a["fit_score"] for a in apps if a.get("fit_score")) / len([a for a in apps if a.get("fit_score")])
        if any(a.get("fit_score") for a in apps)
        else None
    )

    return {
        "total_applications": len(apps),
        "by_status": status_counts,
        "jobs_explored": seen_resp.count or 0,
        "cvs_created": cv_resp.count or 0,
        "avg_fit_score": round(avg_fit, 1) if avg_fit else None,
    }
