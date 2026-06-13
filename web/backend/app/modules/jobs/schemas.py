from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class JobRecord(StrictSchema):
    id: str
    source: str
    source_tier: int = Field(ge=1, le=3)
    is_seeded: bool
    availability_status: str
    title: str
    company: str
    location: str
    employment_type: str
    level: str
    role_type: str | None = None
    skills: list[str] = Field(default_factory=list)
    description: str
    apply_url: str | None = None
    posted_at: date | None = None
    salary_range: str | None = None


class JobsListData(StrictSchema):
    jobs: list[JobRecord]


class JobsMeta(StrictSchema):
    total: int
    source_tier: int
    fallback_used: bool
    live_scraping_enabled: bool = False


class JobsListResponse(StrictSchema):
    data: JobsListData
    meta: JobsMeta


class JobDetailResponse(StrictSchema):
    data: JobRecord
    meta: dict = Field(default_factory=dict)
