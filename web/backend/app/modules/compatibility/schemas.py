from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CompatibilityData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feature: str
    implemented: Literal[False] = False
    status: Literal["post_mvp"] = "post_mvp"
    placeholder: Any = None


class CompatibilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    data: CompatibilityData
    meta: dict = Field(default_factory=dict)


def post_mvp_response(feature: str, placeholder: Any = None) -> CompatibilityResponse:
    return CompatibilityResponse(
        data=CompatibilityData(feature=feature, placeholder=placeholder),
        meta={"compatibility_stub": True},
    )
