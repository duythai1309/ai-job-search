from __future__ import annotations
import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def firecrawl_scrape(
    url: str,
    wait_for_ms: int = 2500,
    only_main: bool = False,
    timeout: float = 60.0,
) -> Optional[str]:
    """Render a URL via the Firecrawl API and return its HTML.

    Returns None on any failure (missing key, network error, unsuccessful
    response) so callers can degrade gracefully instead of crashing search.
    """
    key = settings.firecrawl_api_key
    if not key:
        logger.warning("FIRECRAWL_API_KEY not set — skipping Firecrawl scrape")
        return None

    endpoint = f"{settings.firecrawl_api_url.rstrip('/')}/v1/scrape"
    payload = {
        "url": url,
        "formats": ["rawHtml"],
        "onlyMainContent": only_main,
        "waitFor": wait_for_ms,
        "timeout": int(timeout * 1000),
    }
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=timeout + 10) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:  # noqa: BLE001
        logger.warning("Firecrawl scrape failed for %s (%s)", url, e)
        return None

    if not data.get("success"):
        logger.warning("Firecrawl returned unsuccessful for %s: %s", url, data.get("error"))
        return None

    d = data.get("data") or {}
    return d.get("rawHtml") or d.get("html")
