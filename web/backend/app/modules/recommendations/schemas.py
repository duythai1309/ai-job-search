from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RecommendationRequest(StrictSchema):
    cv_id: UUID
    job_id: str = Field(min_length=1)


class RecommendationSuggestion(StrictSchema):
    target_section: str
    action: str
    reason: str
    cv_evidence: str
    job_evidence: str
    prohibited_claims: list[str] = Field(default_factory=list)


class RecommendationGeneration(StrictSchema):
    suggestions: list[RecommendationSuggestion] = Field(min_length=1, max_length=8)
    priority: Literal["high", "medium", "low"]
    warnings: list[str] = Field(default_factory=list)


class RecommendationRecord(StrictSchema):
    recommendation_id: UUID
    cv_id: UUID
    job_id: str
    suggestions: list[RecommendationSuggestion]
    priority: Literal["high", "medium", "low"]
    evidence_links: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    schema_version: Literal["recommendation_v1"]


class RecommendationResponse(StrictSchema):
    data: RecommendationRecord
    meta: dict = Field(default_factory=dict)
