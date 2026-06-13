from app.modules.jobs.seed import SeedJobSource
from app.modules.jobs.sources.base import SourceJob


class SeedSourceAdapter:
    name = "seed"
    is_live = False

    def __init__(self, source: SeedJobSource | None = None) -> None:
        self._source = source or SeedJobSource()

    def fetch(self, limit: int) -> list[SourceJob]:
        return [
            SourceJob(
                source="seed",
                source_job_id=str(job["id"]),
                title=str(job["title"]),
                company=str(job["company"]),
                location=str(job.get("location", "")),
                employment_type=str(job.get("employment_type", "")),
                level=str(job.get("level", "")),
                role_type=job.get("role_type"),
                skills=list(job.get("skills", [])),
                description=str(job.get("description", "")),
                apply_url=None,
                posted_at=job.get("posted_at"),
                salary_range=job.get("salary_range"),
                availability_status="sample",
                is_seeded=True,
                raw_payload={"seed_id": job["id"]},
            )
            for job in self._source.list_jobs()[:limit]
        ]
