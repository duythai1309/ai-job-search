from __future__ import annotations

from typing import Any


class JobsRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider

    def list_jobs(self, query: str = "", location: str = "", level: str = "", page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        raise NotImplementedError("Jobs repository persistence is not implemented yet.")

    def get_by_id(self, job_id: str) -> dict[str, Any] | None:
        raise NotImplementedError("Jobs repository persistence is not implemented yet.")
