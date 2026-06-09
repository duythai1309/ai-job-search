from __future__ import annotations
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.deps import get_current_user
from app.models.schemas import ChatRequest, UserInfo
from app.db.supabase import get_service_client
from app.services import gemini

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/sessions")
async def list_sessions(user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    resp = (
        client.table("chat_sessions")
        .select("id,title,context_type,created_at")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return resp.data or []


@router.post("/sessions")
async def create_session(
    title: str = "Cuộc trò chuyện mới",
    context_type: str = "general",
    context_id: Optional[UUID] = None,
    user: UserInfo = Depends(get_current_user),
):
    client = get_service_client()
    resp = client.table("chat_sessions").insert({
        "user_id": str(user.id),
        "title": title,
        "context_type": context_type,
        "context_id": str(context_id) if context_id else None,
    }).execute()
    return resp.data[0] if resp.data else {}


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: UUID, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()
    session_resp = (
        client.table("chat_sessions")
        .select("id")
        .eq("id", str(session_id))
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not session_resp.data:
        raise HTTPException(status_code=404, detail="Phiên chat không tồn tại")

    msgs_resp = (
        client.table("chat_messages")
        .select("id,role,content,created_at")
        .eq("session_id", str(session_id))
        .order("created_at")
        .limit(100)
        .execute()
    )
    return msgs_resp.data or []


@router.post("/send")
async def send_message(body: ChatRequest, user: UserInfo = Depends(get_current_user)):
    client = get_service_client()

    session_id = body.session_id
    if not session_id:
        new_session = client.table("chat_sessions").insert({
            "user_id": str(user.id),
            "title": body.message[:50] + ("..." if len(body.message) > 50 else ""),
            "context_type": body.context_type,
            "context_id": str(body.context_id) if body.context_id else None,
        }).execute()
        session_id = new_session.data[0]["id"] if new_session.data else None

    history_resp = (
        client.table("chat_messages")
        .select("role,content")
        .eq("session_id", str(session_id))
        .order("created_at")
        .limit(20)
        .execute()
    )
    history = history_resp.data or []

    client.table("chat_messages").insert({
        "session_id": str(session_id),
        "role": "user",
        "content": body.message,
    }).execute()

    profile_resp = client.table("profiles").select("*").eq("id", str(user.id)).single().execute()
    skills_resp = client.table("skills").select("name,category").eq("user_id", str(user.id)).execute()
    exp_resp = client.table("experience").select("job_title,company").eq("user_id", str(user.id)).execute()

    user_profile = {
        **(profile_resp.data or {}),
        "skills": skills_resp.data or [],
        "experience": exp_resp.data or [],
    }

    context_data = None
    if body.context_id and body.context_type == "job_evaluation":
        job_resp = client.table("job_postings").select("title,company,description").eq("id", str(body.context_id)).single().execute()
        context_data = job_resp.data

    messages = history + [{"role": "user", "content": body.message}]

    async def generate():
        full_response = ""
        async for chunk in gemini.chat_with_context(messages, user_profile, body.context_type, context_data):
            full_response += chunk
            yield chunk

        client.table("chat_messages").insert({
            "session_id": str(session_id),
            "role": "assistant",
            "content": full_response,
        }).execute()

        if len(history) == 0:
            client.table("chat_sessions").update(
                {"title": body.message[:60]}
            ).eq("id", str(session_id)).execute()

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={"X-Session-Id": str(session_id)},
    )
