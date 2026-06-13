from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class FitScoreRequest(StrictSchema):
    analysis_id: UUID | None = None
    job_ids: list[str] = Field(default_factory=list, max_length=20)
    cv_id: UUID | None = None
    job_id: str | None = None

    @model_validator(mode="after")
    def validate_request_shape(self):
        old_shape = self.analysis_id is not None and bool(self.job_ids)
        frontend_shape = self.cv_id is not None and bool(self.job_id)
        if old_shape == frontend_shape:
            raise ValueError(
                "Provide either analysis_id with job_ids or cv_id with job_id."
            )
        return self


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
    score_total: int | None = Field(default=None, ge=0, le=100)
    job_id: str | None = None
    score_breakdown: list["FrontendScoreBreakdown"] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    explanation: str | None = None


class FrontendScoreBreakdown(StrictSchema):
    label: str
    score: int = Field(ge=0, le=100)
    notes: str = ""


class FitScoresResponse(StrictSchema):
    data: FitScoresData
    meta: dict = Field(default_factory=dict)
