from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body

from app.modules.compatibility.schemas import (
    CompatibilityResponse,
    post_mvp_response,
)


router = APIRouter(tags=["post-mvp compatibility"])


@router.get("/chat/sessions", response_model=CompatibilityResponse)
def list_chat_sessions() -> CompatibilityResponse:
    return post_mvp_response("chat", {"sessions": []})


@router.post("/chat/sessions", response_model=CompatibilityResponse)
def create_chat_session(
    payload: dict[str, Any] = Body(default_factory=dict),
) -> CompatibilityResponse:
    return post_mvp_response("chat", {"session": None})


@router.post("/chat/messages", response_model=CompatibilityResponse)
def create_chat_message(
    payload: dict[str, Any] = Body(default_factory=dict),
) -> CompatibilityResponse:
    return post_mvp_response("chat", {"message": None})


@router.get("/analytics/market", response_model=CompatibilityResponse)
def get_market_analytics() -> CompatibilityResponse:
    return post_mvp_response("analytics", {"insights": []})


@router.post("/cover-letters", response_model=CompatibilityResponse)
def create_cover_letter(
    payload: dict[str, Any] = Body(default_factory=dict),
) -> CompatibilityResponse:
    return post_mvp_response("cover_letters", {"cover_letter": None})


@router.post("/exports/pdf", response_model=CompatibilityResponse)
def export_pdf(
    payload: dict[str, Any] = Body(default_factory=dict),
) -> CompatibilityResponse:
    return post_mvp_response("pdf_export", {"download_url": None})
