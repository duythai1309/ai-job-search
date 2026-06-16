from __future__ import annotations
import asyncio
from datetime import datetime, timezone
from typing import Optional

from app.scrapers.base import ScrapedJob
from app.scrapers.vietnamworks import VietnamWorksScraper
from app.scrapers.itviec import ITviecScraper
from app.scrapers.topcv import TopCVScraper
from app.scrapers.careerviet import CareerVietScraper
from app.scrapers.ybox import YboxScraper
from app.scrapers.vieclam24h import Vieclam24hScraper
from app.db.supabase import get_service_client

SCRAPERS = {
    "vietnamworks": VietnamWorksScraper(),
    "itviec": ITviecScraper(),
    "topcv": TopCVScraper(),
    "careerviet": CareerVietScraper(),
    "ybox": YboxScraper(),
    "vieclam24h": Vieclam24hScraper(),
}

# Queries the periodic crawl uses to broadly populate the DB.
DEFAULT_CRAWL_QUERIES = [
    "Frontend Developer", "Backend Developer", "Fullstack Developer",
    "Data Analyst", "Data Engineer", "DevOps Engineer",
    "Mobile Developer", "QA Tester", "Product Manager",
    "UI UX Designer", "Business Analyst", "Marketing",
    "Kế toán", "Nhân sự", "Sales",
]


def query_db(
    query: str = "",
    location: str = "",
    sources: Optional[list[str]] = None,
    page: int = 1,
    limit: int = 20,
) -> list[dict]:
    """Read jobs from the DB only (no live scraping). Used by /jobs/search."""
    client = get_service_client()
    qb = client.table("job_postings").select("*").eq("is_active", True)
    if sources:
        qb = qb.in_("source", sources)
    if query and query.strip():
        like = f"%{query.strip().replace(',', ' ')}%"
        qb = qb.or_(f"title.ilike.{like},company.ilike.{like}")
    if location and location.strip():
        qb = qb.ilike("location", f"%{location.strip()}%")
    offset = (page - 1) * limit
    resp = qb.order("scraped_at", desc=True).range(offset, offset + limit - 1).execute()
    return resp.data or []


async def crawl_and_store(
    queries: list[str],
    sources: Optional[list[str]] = None,
    location: str = "",
    limit_per: int = 30,
) -> dict:
    """Scrape the given queries across sources and upsert into the DB.

    Used by the manual crawl button and the periodic cron. Each source is asked
    for up to ``limit_per`` jobs per query.
    """
    active = {k: v for k, v in SCRAPERS.items() if sources is None or k in sources}
    if not active:
        return {"total": 0, "by_source": {}, "queries": 0}

    by_source = {k: 0 for k in active}
    all_jobs: list[ScrapedJob] = []
    for q in queries:
        tasks = [s.search(q, location, page=1, limit=limit_per) for s in active.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for name, res in zip(active.keys(), results):
            if isinstance(res, list):
                by_source[name] += len(res)
                all_jobs.extend(res)

    upserted = await _upsert_jobs(all_jobs)
    return {"total": len(upserted), "by_source": by_source, "queries": len(queries)}


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
    # Dedupe by url within the batch — Postgres ON CONFLICT errors if the same
    # conflict target appears twice in one upsert.
    seen: set[str] = set()
    records = []
    for j in jobs:
        if not j.url or j.url in seen:
            continue
        seen.add(j.url)
        records.append(_job_to_record(j))

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
