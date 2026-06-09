from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user
from app.models.schemas import (
    EducationCreate, ExperienceCreate, ProfileUpdate, SkillCreate, UserInfo
)
from app.db.supabase import get_service_client

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/")
async def get_profile(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    profile = client.table("profiles").select("*").eq("id", str(user.id)).single().execute()
    edu = client.table("education").select("*").eq("user_id", str(user.id)).order("sort_order").execute()
    exp = client.table("experience").select("*").eq("user_id", str(user.id)).order("sort_order").execute()
    skills = client.table("skills").select("*").eq("user_id", str(user.id)).execute()
    return {
        **(profile.data or {}),
        "education": edu.data or [],
        "experience": exp.data or [],
        "skills": skills.data or [],
    }


@router.patch("/")
async def update_profile(body: ProfileUpdate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    resp = client.table("profiles").update(update_data).eq("id", str(user.id)).execute()
    return resp.data[0] if resp.data else {}


@router.post("/education")
async def add_education(body: EducationCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    data = body.model_dump()
    data["user_id"] = str(user.id)
    resp = client.table("education").insert(data).execute()
    return resp.data[0] if resp.data else {}


@router.patch("/education/{edu_id}")
async def update_education(edu_id: UUID, body: EducationCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = client.table("education").update(body.model_dump()).eq("id", str(edu_id)).eq("user_id", str(user.id)).execute()
    return resp.data[0] if resp.data else {}


@router.delete("/education/{edu_id}")
async def delete_education(edu_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    client.table("education").delete().eq("id", str(edu_id)).eq("user_id", str(user.id)).execute()
    return {"ok": True}


@router.post("/experience")
async def add_experience(body: ExperienceCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    data = body.model_dump()
    data["user_id"] = str(user.id)
    for key in ("start_date", "end_date"):
        if data.get(key):
            data[key] = str(data[key])
    resp = client.table("experience").insert(data).execute()
    return resp.data[0] if resp.data else {}


@router.patch("/experience/{exp_id}")
async def update_experience(exp_id: UUID, body: ExperienceCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    data = body.model_dump()
    for key in ("start_date", "end_date"):
        if data.get(key):
            data[key] = str(data[key])
    resp = client.table("experience").update(data).eq("id", str(exp_id)).eq("user_id", str(user.id)).execute()
    return resp.data[0] if resp.data else {}


@router.delete("/experience/{exp_id}")
async def delete_experience(exp_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    client.table("experience").delete().eq("id", str(exp_id)).eq("user_id", str(user.id)).execute()
    return {"ok": True}


@router.post("/skills")
async def add_skill(body: SkillCreate, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    data = body.model_dump()
    data["user_id"] = str(user.id)
    resp = client.table("skills").insert(data).execute()
    return resp.data[0] if resp.data else {}


@router.delete("/skills/{skill_id}")
async def delete_skill(skill_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    client.table("skills").delete().eq("id", str(skill_id)).eq("user_id", str(user.id)).execute()
    return {"ok": True}


@router.put("/skills")
async def replace_skills(skills: list[SkillCreate], user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    client.table("skills").delete().eq("user_id", str(user.id)).execute()
    if skills:
        records = [{**s.model_dump(), "user_id": str(user.id)} for s in skills]
        client.table("skills").insert(records).execute()
    return {"ok": True, "count": len(skills)}
