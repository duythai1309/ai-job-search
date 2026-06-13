from __future__ import annotations

from typing import Protocol

from app.modules.jobs.schemas import JobRecord


class JobScraperAdapter(Protocol):
    source: str

    async def search(
        self,
        *,
        query: str,
        location: str,
        limit: int,
    ) -> list[JobRecord]:
        """Return normalized legally accessible job records."""


class DisabledJobScraperAdapter:
    source = "disabled"

    async def search(
        self,
        *,
        query: str,
        location: str,
        limit: int,
    ) -> list[JobRecord]:
        return []
