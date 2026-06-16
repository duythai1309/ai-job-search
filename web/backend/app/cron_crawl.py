"""Periodic crawl entry point.

Run on a schedule (e.g. Render Cron Job) to populate job_postings so that
/jobs/search can read from the DB only.

    python -m app.cron_crawl                 # crawl DEFAULT_CRAWL_QUERIES, all sources
    python -m app.cron_crawl topcv,itviec    # restrict to given sources

Requires FIRECRAWL_API_KEY (+ Supabase env) in the environment.
"""
from __future__ import annotations
import asyncio
import sys

from app.services.job_scraper import crawl_and_store, DEFAULT_CRAWL_QUERIES


async def _run(sources: list[str] | None):
    result = await crawl_and_store(DEFAULT_CRAWL_QUERIES, sources)
    print("[cron_crawl]", result)


if __name__ == "__main__":
    src = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        src = [s.strip() for s in sys.argv[1].split(",") if s.strip()]
    asyncio.run(_run(src))
