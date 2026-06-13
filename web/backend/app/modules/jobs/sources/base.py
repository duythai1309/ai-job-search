from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(slots=True)
class SourceJob:
    source: str
    title: str
    company: str
    source_job_id: str | None = None
    location: str = ""
    employment_type: str = ""
    level: str = ""
    role_type: str | None = None
    skills: list[str] = field(default_factory=list)
    description: str = ""
    apply_url: str | None = None
    posted_at: str | None = None
    salary_range: str | None = None
    availability_status: str = "unknown"
    is_seeded: bool = False
    raw_payload: dict | None = None


class JobSource(Protocol):
    name: str
    is_live: bool

    def fetch(self, limit: int) -> list[SourceJob]: ...


class DisabledLiveSource:
    is_live = True
    reason = "Live ingestion requires an approved public API or feed."

    def fetch(self, limit: int) -> list[SourceJob]:
        return []
