from __future__ import annotations
import logging
import re
from typing import Optional
from urllib.parse import quote

from bs4 import BeautifulSoup

from .base import BaseJobScraper, ScrapedJob
from .firecrawl_base import firecrawl_scrape
from .jsonld import parse_jsonld_jobs

logger = logging.getLogger(__name__)


def _parse_salary(text: str) -> tuple[Optional[int], Optional[int], bool]:
    t = text.lower()
    if "thỏa thuận" in t or "thoa thuan" in t:
        return None, None, True
    nums = re.findall(r"\d+(?:[.,]\d+)?", text)
    if not nums:
        return None, None, True
    mult = 1_000_000 if "triệu" in t or "tr" in t else 1
    vals = sorted(int(float(n.replace(",", ".")) * mult) for n in nums)
    return vals[0], vals[-1], False


class Vieclam24hScraper(BaseJobScraper):
    """Vieclam24h (vieclam24h.vn) via Firecrawl.

    Search: /tim-kiem-viec-lam-nhanh?q=<query>&page=<n> (verified).
    Result cards are <a data-job-id="..." href=".../<slug>id<num>.html"> with:
      - 1st <h3> = job title, 2nd <h3> = company (img alt = company fallback)
      - a <span> containing 'triệu'/'thỏa thuận' = salary
      - .tooltip-content / .province-tooltip span = location
    """

    source = "vieclam24h"
    base_url = "https://vieclam24h.vn"

    def _search_url(self, query: str, page: int) -> str:
        url = f"{self.base_url}/tim-kiem-viec-lam-nhanh?q={quote(query)}"
        if page > 1:
            url += f"&page={page}"
        return url

    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        html = await firecrawl_scrape(self._search_url(query, page))
        if not html:
            return []
        jobs = parse_jsonld_jobs(html, self.source)
        if not jobs:
            jobs = self._parse_dom(html)
        return jobs[:limit]

    def _parse_dom(self, html: str) -> list[ScrapedJob]:
        soup = BeautifulSoup(html, "lxml")
        jobs: list[ScrapedJob] = []
        seen: set[str] = set()
        for a in soup.select("a[data-job-id]"):
            href = a.get("href", "")
            if not href:
                continue
            clean = href.split("?")[0]
            url = clean if clean.startswith("http") else f"{self.base_url}{clean}"
            if url in seen:
                continue
            seen.add(url)

            h3s = a.find_all("h3")
            title = h3s[0].get_text(strip=True) if h3s else ""
            if not title:
                continue
            img = a.find("img")
            img_alt = (img.get("alt") or "").strip() if img else ""
            company = (h3s[1].get_text(strip=True) if len(h3s) > 1 else "") or img_alt or "Unknown"

            sal_min = sal_max = None
            negotiable = True
            for sp in a.find_all("span"):
                t = sp.get_text(strip=True)
                if "triệu" in t.lower() or "thỏa thuận" in t.lower():
                    sal_min, sal_max, negotiable = _parse_salary(t)
                    break

            loc_el = a.select_one(".tooltip-content, .province-tooltip span")
            location = loc_el.get_text(strip=True) if loc_el else None

            jobs.append(
                ScrapedJob(
                    external_id=a.get("data-job-id") or url.rstrip("/").split("/")[-1],
                    source=self.source,
                    title=title,
                    company=company,
                    url=url,
                    location=location,
                    salary_min=sal_min,
                    salary_max=sal_max,
                    salary_currency="VND",
                    salary_negotiable=negotiable,
                    company_logo_url=(img.get("src") if img else None),
                    raw_data={"source": self.source, "via": "dom"},
                )
            )
        return jobs

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        # Job detail URLs embed a full slug; we can't rebuild them from the id
        # alone, so detail fetching is not supported (search already returns
        # complete cards).
        return None
