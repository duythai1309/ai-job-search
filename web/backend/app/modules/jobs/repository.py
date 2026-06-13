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
