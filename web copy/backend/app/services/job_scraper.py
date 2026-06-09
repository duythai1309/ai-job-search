from __future__ import annotations
import asyncio
from datetime import datetime, timezone
from typing import Optional

from app.scrapers.base import ScrapedJob
from app.scrapers.vietnamworks import VietnamWorksScraper
from app.scrapers.itviec import ITviecScraper
from app.scrapers.topcv import TopCVScraper
from app.scrapers.careerviet import CareerVietScraper
from app.db.supabase import get_service_client

SCRAPERS = {
    "vietnamworks": VietnamWorksScraper(),
    "itviec": ITviecScraper(),
    "topcv": TopCVScraper(),
    "careerviet": CareerVietScraper(),
}


async def search_jobs(
    query: str,
    location: str = "",
    sources: Optional[list[str]] = None,
    page: int = 1,
    limit: int = 20,
) -> list[dict]:
    active_scrapers = {
        k: v for k, v in SCRAPERS.items()
        if sources is None or k in sources
    }

    per_scraper = max(limit // len(active_scrapers), 5)

    tasks = [
        scraper.search(query, location, page=page, limit=per_scraper)
        for scraper in active_scrapers.values()
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    jobs: list[ScrapedJob] = []
    for result in results:
        if isinstance(result, list):
            jobs.extend(result)

    upserted = await _upsert_jobs(jobs)
    return upserted[:limit]


async def _upsert_jobs(jobs: list[ScrapedJob]) -> list[dict]:
    if not jobs:
        return []

    client = get_service_client()
    records = [_job_to_record(j) for j in jobs]

    try:
        resp = (
            client.table("job_postings")
            .upsert(records, on_conflict="url", ignore_duplicates=False)
            .execute()
        )
        return resp.data or []
    except Exception:
        existing = (
            client.table("job_postings")
            .select("*")
            .in_("url", [r["url"] for r in records])
            .execute()
        )
        return existing.data or []


def _job_to_record(job: ScrapedJob) -> dict:
    return {
        "external_id": job.external_id,
        "source": job.source,
        "title": job.title,
        "company": job.company,
        "company_logo_url": job.company_logo_url,
        "location": job.location,
        "is_remote": job.is_remote,
        "description": job.description,
        "requirements": job.requirements,
        "benefits": job.benefits,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency,
        "salary_negotiable": job.salary_negotiable,
        "employment_type": job.employment_type,
        "experience_years_min": job.experience_years_min,
        "experience_years_max": job.experience_years_max,
        "skills_required": job.skills_required,
        "posted_at": job.posted_at.isoformat() if job.posted_at else None,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "url": job.url,
        "is_active": True,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "raw_data": job.raw_data,
    }
