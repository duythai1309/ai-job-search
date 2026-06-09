from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class ScrapedJob:
    external_id: str
    source: str
    title: str
    company: str
    url: str
    location: Optional[str] = None
    is_remote: bool = False
    description: Optional[str] = None
    requirements: list[str] = field(default_factory=list)
    benefits: list[str] = field(default_factory=list)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "VND"
    salary_negotiable: bool = False
    employment_type: Optional[str] = None
    experience_years_min: Optional[int] = None
    experience_years_max: Optional[int] = None
    skills_required: list[str] = field(default_factory=list)
    company_logo_url: Optional[str] = None
    posted_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    raw_data: Optional[dict] = None


class BaseJobScraper(ABC):
    source: str = ""
    base_url: str = ""

    @abstractmethod
    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        ...

    @abstractmethod
    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        ...
