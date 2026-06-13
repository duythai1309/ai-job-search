from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator


class APIErrorDetail(BaseModel):
    code: str
    message: str


class APIErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str
    details: dict[str, Any] | None = None
    error: APIErrorDetail | None = None

    @model_validator(mode="after")
    def populate_error_envelope(self):
        if self.error is None:
            self.error = APIErrorDetail(code=self.code, message=self.message)
        return self


class APISuccessEnvelope(BaseModel):
    data: Any = None
    meta: dict[str, Any] = Field(default_factory=dict)

