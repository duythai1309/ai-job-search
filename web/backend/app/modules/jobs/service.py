from __future__ import annotations

from app.modules.jobs.repository import JobsRepository, JobsRepositoryError
from app.modules.jobs.schemas import (
    JobDetailResponse,
    JobRecord,
    JobsListData,
    JobsListResponse,
    JobsMeta,
)
from app.modules.jobs.seed import SeedJobSource


class JobNotFoundError(LookupError):
    pass


class JobsService:
    def __init__(
        self,
        repository: JobsRepository | None = None,
        seed_source: SeedJobSource | None = None,
    ) -> None:
        self._repository = repository or JobsRepository()
        self._seed_source = seed_source or SeedJobSource()

    def list_jobs(
        self,
        *,
        query: str = "",
        location: str = "",
        role_type: str = "",
        level: str = "",
        limit: int = 20,
    ) -> JobsListResponse:
        fallback_used = False
        try:
            raw_jobs = self._repository.list_jobs(limit=limit)
        except JobsRepositoryError:
            raw_jobs = []

        if not raw_jobs:
            raw_jobs = self._seed_source.list_jobs()
            fallback_used = True

        jobs = [
            self._normalize(job)
            for job in raw_jobs
            if self._matches(job, query, location, role_type, level)
        ][:limit]
        source_tier = min((job.source_tier for job in jobs), default=3)
        return JobsListResponse(
            data=JobsListData(jobs=jobs),
            meta=JobsMeta(
                total=len(jobs),
                source_tier=source_tier,
                fallback_used=fallback_used,
            ),
        )

    def get_job(self, job_id: str) -> JobDetailResponse:
        try:
            raw_job = self._repository.get_by_id(job_id)
        except JobsRepositoryError:
            raw_job = None
        fallback_used = raw_job is None
        raw_job = raw_job or self._seed_source.get_by_id(job_id)
        if raw_job is None:
            raise JobNotFoundError(job_id)
        return JobDetailResponse(
            data=self._normalize(raw_job),
            meta={"fallback_used": fallback_used},
        )

    @staticmethod
    def _matches(
        job: dict,
        query: str,
        location: str,
        role_type: str,
        level: str,
    ) -> bool:
        haystack = " ".join(
            [
                str(job.get("title", "")),
                str(job.get("company", "")),
                str(job.get("description", "")),
                " ".join(job.get("skills") or job.get("skills_required") or []),
            ]
        ).casefold()
        job_location = str(job.get("location", "")).casefold()
        job_role_type = str(
            job.get("role_type") or job.get("employment_type", "")
        ).casefold()
        job_level = str(job.get("level", "")).casefold()
        return (
            (not query or query.casefold() in haystack)
            and (not location or location.casefold() in job_location)
            and (not role_type or role_type.casefold() in job_role_type)
            and (not level or level.casefold() in job_level)
        )

    @staticmethod
    def _normalize(job: dict) -> JobRecord:
        is_seeded = bool(job.get("is_seeded", False))
        return JobRecord(
            id=str(job["id"]),
            source=str(job.get("source", "supabase")),
            source_tier=int(job.get("source_tier", 3 if is_seeded else 1)),
            is_seeded=is_seeded,
            availability_status=str(
                job.get("availability_status", "sample" if is_seeded else "unknown")
            ),
            title=str(job.get("title", "")),
            company=str(job.get("company", "")),
            location=str(job.get("location", "")),
            employment_type=str(job.get("employment_type", "")),
            level=str(job.get("level", "")),
            role_type=job.get("role_type"),
            skills=list(job.get("skills") or job.get("skills_required") or []),
            description=str(job.get("description", "")),
            apply_url=None if is_seeded else job.get("apply_url") or job.get("url"),
            posted_at=job.get("posted_at"),
            salary_range=job.get("salary_range"),
        )
