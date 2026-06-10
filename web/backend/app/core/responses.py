from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class APIErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str
    details: dict[str, Any] | None = None


class APISuccessEnvelope(BaseModel):
    data: Any = None
    meta: dict[str, Any] = Field(default_factory=dict)

