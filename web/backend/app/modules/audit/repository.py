from __future__ import annotations

from typing import Any


class AuditRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider

    def append_event(self, event: dict[str, Any]) -> None:
        raise NotImplementedError("Audit repository persistence is not implemented yet.")
