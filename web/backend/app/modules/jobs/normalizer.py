from __future__ import annotations

import hashlib
import re

from app.modules.jobs.sources.base import SourceJob

TECH_TERMS = (
    "data", "ai", "artificial intelligence", "it ", "software", "backend",
    "frontend", "fullstack", "full stack", "developer", "engineer", "machine learning",
    "mlops", "devops", "cloud", "cybersecurity", "business intelligence",
)
EXCLUDED_TERMS = ("sales", "accounting", "human resources", "marketing")


def is_relevant_tech_job(job: SourceJob) -> bool:
    text = f"{job.title} {job.role_type or ''} {' '.join(job.skills)}".casefold()
    if any(term in text for term in TECH_TERMS):
        return True
    return not any(term in text for term in EXCLUDED_TERMS) and bool(
        re.search(r"\b(intern|fresher)\b", text)
        and re.search(r"\b(tech|computer|systems|analytics)\b", text)
    )


def normalize_job(job: SourceJob) -> dict:
    source_job_id = job.source_job_id
    fingerprint = "|".join((job.source, source_job_id or "", job.company, job.title, job.apply_url or ""))
    job_id = f"ingest-{hashlib.sha256(fingerprint.encode()).hexdigest()[:20]}"
    return {
        "id": job_id,
        "source": job.source,
        "source_tier": 3 if job.is_seeded else 1,
        "is_seeded": job.is_seeded,
        "availability_status": job.availability_status,
        "title": job.title.strip(),
        "company": job.company.strip(),
        "location": job.location.strip(),
        "employment_type": job.employment_type.strip(),
        "level": job.level.strip(),
        "role_type": job.role_type,
        "skills": sorted({skill.strip() for skill in job.skills if skill.strip()}),
        "description": job.description.strip(),
        "apply_url": None if job.is_seeded else job.apply_url,
        "posted_at": job.posted_at,
        "salary_range": job.salary_range,
        "source_job_id": source_job_id,
        "raw_payload": job.raw_payload,
    }


def dedupe_jobs(jobs: list[dict]) -> list[dict]:
    seen: set[tuple] = set()
    result = []
    for job in jobs:
        key = (
            ("source", job["source"], job["source_job_id"])
            if job.get("source_job_id")
            else ("fallback", job["company"].casefold(), job["title"].casefold(), job.get("apply_url"))
        )
        if key not in seen:
            seen.add(key)
            result.append(job)
    return result
