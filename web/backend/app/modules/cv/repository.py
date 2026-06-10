from __future__ import annotations

from typing import Any


class CvRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError("CV repository persistence is not implemented yet.")

    def get_by_id(self, cv_id: str, user_id: str) -> dict[str, Any] | None:
        raise NotImplementedError("CV repository persistence is not implemented yet.")

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("CV repository persistence is not implemented yet.")

    def delete(self, cv_id: str, user_id: str) -> None:
        raise NotImplementedError("CV repository persistence is not implemented yet.")
