from __future__ import annotations
import logging
import re
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from .base import BaseJobScraper, ScrapedJob
from .firecrawl_base import firecrawl_scrape
from .jsonld import parse_jsonld_jobs

logger = logging.getLogger(__name__)


class YboxScraper(BaseJobScraper):
    """YBOX (ybox.vn) via Firecrawl.

    YBOX is a React SPA focused on opportunities (jobs, internships,
    scholarships, contests). Result cards are ``.post--article`` with the
    opportunity link ``/tuyen-dung/<slug>`` and the title in the photo
    ``<img alt="[Location] Company - Description ...">``. The right-hand
    ``.recommended-posts`` sidebar is dropped so only real results are parsed.

    Note: YBOX has little/no pure-IT listings, so tech queries (e.g. "Frontend
    Developer") may legitimately return 0 results.
    """

    source = "ybox"
    base_url = "https://ybox.vn"
    SEARCH_PATH = "/tuyen-dung-viec-lam-tk-c1"

    def _search_url(self, query: str, page: int) -> str:
        url = f"{self.base_url}{self.SEARCH_PATH}?keyword={quote_plus(query)}"
        if page > 1:
            url += f"&page={page}"
        return url

    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        html = await firecrawl_scrape(self._search_url(query, page))
        if not html:
            return []
        if "404 - YBOX" in html:
            logger.warning("YBOX search URL returned 404 (%s)", self._search_url(query, page))
            return []
        jobs = parse_jsonld_jobs(html, self.source)
        if not jobs:
            jobs = self._parse_dom(html)
        return jobs[:limit]

    def _parse_dom(self, html: str) -> list[ScrapedJob]:
        soup = BeautifulSoup(html, "lxml")
        # Drop the "Có thể bạn thích" sidebar so we only keep real results.
        for rec in soup.select(".recommended-posts"):
            rec.decompose()

        jobs: list[ScrapedJob] = []
        seen: set[str] = set()
        for card in soup.select("div.post--article, div.post.post--article"):
            try:
                job = self._parse_card(card)
            except Exception:
                continue
            if not job or job.url in seen:
                continue
            seen.add(job.url)
            jobs.append(job)
        return jobs

    def _parse_card(self, card) -> Optional[ScrapedJob]:
        link = None
        for cand in card.select("a[href*='/tuyen-dung/']"):
            href = cand.get("href", "")
            if re.search(r"/tuyen-dung/.+", href):  # has a slug, not the category link
                link = cand
                break
        if link is None:
            return None
        href = link.get("href", "").split("?")[0]
        url = href if href.startswith("http") else f"{self.base_url}{href}"
        img = link.find("img") or card.select_one(".photo img, img.img-responsive")
        title = ((img.get("alt") if img else "") or link.get_text(strip=True) or "").strip()
        if len(title) < 6:
            return None

        location = None
        rest = title
        m = re.match(r"\s*\[([^\]]+)\]\s*", title)
        if m:
            location = m.group(1).strip()
            rest = title[m.end():]
        company = re.split(r"\s+-\s+|\s+Tuyển\b", rest, maxsplit=1)[0].strip()[:120] or "YBOX"

        return ScrapedJob(
            external_id=href.rstrip("/").split("/")[-1] or title.lower().replace(" ", "-")[:80],
            source=self.source,
            title=title,
            company=company,
            url=url,
            location=location,
            salary_currency="VND",
            salary_negotiable=True,
            company_logo_url=(img.get("src") if img else None),
            raw_data={"source": self.source, "via": "dom"},
        )

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        html = await firecrawl_scrape(f"{self.base_url}/tuyen-dung/{external_id}")
        if not html:
            return None
        jobs = parse_jsonld_jobs(html, self.source)
        return jobs[0] if jobs else None
