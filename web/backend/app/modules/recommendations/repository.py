from __future__ import annotations

from typing import Any


class RecommendationsRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider

    def get_by_cv_and_job(self, cv_id: str, job_id: str) -> dict[str, Any] | None:
        raise NotImplementedError("Recommendations repository persistence is not implemented yet.")

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("Recommendations repository persistence is not implemented yet.")
