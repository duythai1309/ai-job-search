from __future__ import annotations

from typing import Any

from app.db.supabase_client import get_supabase_service_client


class JobsRepositoryError(RuntimeError):
    pass


class JobsRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider or get_supabase_service_client

    def list_jobs(self, limit: int = 20) -> list[dict[str, Any]]:
        try:
            response = (
                self._client_provider()
                .table("job_postings")
                .select("*")
                .limit(limit)
                .execute()
            )
        except Exception as exc:
            raise JobsRepositoryError("Job listing failed.") from exc
        return response.data or []

    def get_by_id(self, job_id: str) -> dict[str, Any] | None:
        try:
            response = (
                self._client_provider()
                .table("job_postings")
                .select("*")
                .eq("id", job_id)
                .maybe_single()
                .execute()
            )
        except Exception as exc:
            raise JobsRepositoryError("Job lookup failed.") from exc
        return response.data

    def upsert_jobs(self, jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not jobs:
            return []
        try:
            response = (
                self._client_provider()
                .table("job_postings")
                .upsert(jobs, on_conflict="source,source_job_id")
                .execute()
            )
        except Exception as exc:
            raise JobsRepositoryError("Job ingestion persistence failed.") from exc
        return response.data or []
