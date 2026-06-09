from __future__ import annotations
import re
from datetime import datetime
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import BaseJobScraper, ScrapedJob

LOCATION_MAP = {
    "hà nội": 29, "hanoi": 29, "hn": 29,
    "hồ chí minh": 24, "ho chi minh": 24, "hcm": 24, "tphcm": 24,
    "đà nẵng": 30, "da nang": 30,
    "cần thơ": 65, "can tho": 65,
    "bình dương": 56, "binh duong": 56,
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; JobVietBot/1.0)",
    "Accept": "application/json",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    "Origin": "https://www.vietnamworks.com",
    "Referer": "https://www.vietnamworks.com/",
}


def _parse_salary(job: dict) -> tuple[Optional[int], Optional[int], bool]:
    salary = job.get("salary", {}) or {}
    negotiable = salary.get("negotiable", False)
    low = salary.get("low")
    high = salary.get("high")
    low = int(low * 1_000_000) if low else None
    high = int(high * 1_000_000) if high else None
    return low, high, negotiable


def _parse_experience(job: dict) -> tuple[Optional[int], Optional[int]]:
    exp = job.get("minimumYearsOfExperience")
    if exp is None:
        return None, None
    return int(exp), None


class VietnamWorksScraper(BaseJobScraper):
    source = "vietnamworks"
    base_url = "https://ms.vietnamworks.com"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        location_id = LOCATION_MAP.get(location.lower().strip()) if location else None

        params: dict = {
            "query": query,
            "page": page - 1,
            "size": limit,
            "sort": "createdDate:desc",
        }
        if location_id:
            params["locationId"] = location_id

        async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
            resp = await client.get(f"{self.base_url}/job-search/v1.1/jobs", params=params)
            resp.raise_for_status()
            data = resp.json()

        jobs: list[ScrapedJob] = []
        for item in data.get("data", []):
            try:
                jobs.append(self._parse_item(item))
            except Exception:
                continue
        return jobs

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
            resp = await client.get(f"{self.base_url}/job-search/v1.1/jobs/{external_id}")
            if resp.status_code != 200:
                return None
            item = resp.json().get("data", {})
        return self._parse_item(item) if item else None

    def _parse_item(self, item: dict) -> ScrapedJob:
        sal_min, sal_max, negotiable = _parse_salary(item)
        exp_min, exp_max = _parse_experience(item)
        skills = [s.get("skillName", "") for s in item.get("skills", []) if s.get("skillName")]
        benefits = [b.get("benefitName", "") for b in item.get("benefits", []) if b.get("benefitName")]
        job_id = str(item.get("jobId", ""))
        location_objs = item.get("workingLocations", []) or []
        location = ", ".join(
            loc.get("cityName", "") for loc in location_objs if loc.get("cityName")
        )
        posted_ts = item.get("approvedDate")
        posted_at = datetime.fromtimestamp(posted_ts / 1000) if posted_ts else None

        return ScrapedJob(
            external_id=job_id,
            source=self.source,
            title=item.get("jobTitle", "").strip(),
            company=item.get("companyName", "").strip(),
            url=f"https://www.vietnamworks.com/job/{job_id}",
            location=location or None,
            is_remote=any("remote" in str(loc).lower() for loc in location_objs),
            description=item.get("jobDescription", ""),
            requirements=item.get("jobRequirement", "").split("\n") if item.get("jobRequirement") else [],
            benefits=benefits,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="VND",
            salary_negotiable=negotiable,
            employment_type=item.get("typeOfWork", {}).get("name", "").lower().replace(" ", "-") if item.get("typeOfWork") else None,
            experience_years_min=exp_min,
            experience_years_max=exp_max,
            skills_required=skills,
            company_logo_url=item.get("companyLogo", ""),
            posted_at=posted_at,
            raw_data={"source": self.source, "id": job_id},
        )
