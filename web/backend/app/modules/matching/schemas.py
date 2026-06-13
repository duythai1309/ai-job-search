from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class FitScoreRequest(StrictSchema):
    analysis_id: UUID
    job_ids: list[str] = Field(min_length=1, max_length=20)


class ScoreBreakdown(StrictSchema):
    skills: int = Field(ge=0, le=70)
    role_alignment: int = Field(ge=0, le=20)
    readiness: int = Field(ge=0, le=10)


class FitScoreResult(StrictSchema):
    match_id: UUID
    analysis_id: UUID
    job_id: str
    score: int = Field(ge=0, le=100)
    breakdown: ScoreBreakdown
    matched_skills: list[str]
    missing_skills: list[str]
    scoring_version: str
    input_fingerprint: str


class FitScoresData(StrictSchema):
    results: list[FitScoreResult]


class FitScoresResponse(StrictSchema):
    data: FitScoresData
    meta: dict = Field(default_factory=dict)
