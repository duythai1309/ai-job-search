from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CandidateSkillsV1(StrictSchema):
    technical: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)


class EducationItemV1(StrictSchema):
    institution: str = Field(min_length=1)
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    details: list[str] = Field(default_factory=list)


class ExperienceItemV1(StrictSchema):
    role: str = Field(min_length=1)
    organization: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    highlights: list[str] = Field(default_factory=list)


class ProjectItemV1(StrictSchema):
    name: str = Field(min_length=1)
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)


class CertificationItemV1(StrictSchema):
    name: str = Field(min_length=1)
    issuer: str | None = None
    issued_date: str | None = None


class CandidateProfileV1(StrictSchema):
    summary: str
    target_roles: list[str] = Field(default_factory=list)
    skills: CandidateSkillsV1
    education: list[EducationItemV1] = Field(default_factory=list)
    experience: list[ExperienceItemV1] = Field(default_factory=list)
    projects: list[ProjectItemV1] = Field(default_factory=list)
    certifications: list[CertificationItemV1] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


class CvAnalysisRequest(StrictSchema):
    cv_id: UUID


class CvAnalysisRecord(StrictSchema):
    analysis_id: UUID
    cv_id: UUID
    schema_version: Literal["candidate_profile_v1"]
    profile: CandidateProfileV1
    overall_score: int = Field(ge=0, le=100)
    top_priorities: list[str] = Field(default_factory=list)
    sections: list["CvAnalysisSection"] = Field(default_factory=list)


class CvAnalysisSection(StrictSchema):
    id: str
    title: str
    content_preview: str
    score: int = Field(ge=0, le=10)
    issues: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class CvAnalysisMeta(StrictSchema):
    persisted: Literal[True] = True


class CvAnalysisResponse(StrictSchema):
    data: CvAnalysisRecord
    meta: CvAnalysisMeta
    error: None = None


class PersistedCvAnalysis(StrictSchema):
    id: UUID
    cv_id: UUID
    schema_version: str
    profile_json: dict
    model_name: str | None = None
    validation_state: str
    created_at: datetime
