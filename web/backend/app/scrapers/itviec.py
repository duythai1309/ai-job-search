from __future__ import annotations
import re
from typing import Optional
from urllib.parse import quote

from bs4 import BeautifulSoup

from .base import BaseJobScraper, ScrapedJob
from .firecrawl_base import firecrawl_scrape
from .jsonld import parse_jsonld_jobs


class ITviecScraper(BaseJobScraper):
    source = "itviec"
    base_url = "https://itviec.com"

    def _search_url(self, query: str, location: str, page: int) -> str:
        loc_slug = ""
        if location:
            ll = location.lower()
            if "hà nội" in ll or "hanoi" in ll or "hn" in ll:
                loc_slug = "ha-noi"
            elif "hồ chí minh" in ll or "hcm" in ll or "tphcm" in ll:
                loc_slug = "ho-chi-minh-city"
            elif "đà nẵng" in ll or "da nang" in ll:
                loc_slug = "da-nang"
        url = f"{self.base_url}/it-jobs/{quote(query.replace(' ', '-'))}"
        if loc_slug:
            url += f"-{loc_slug}"
        if page > 1:
            url += f"?page={page}"
        return url

    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        html = await firecrawl_scrape(self._search_url(query, location, page))
        if not html:
            return []
        jobs = parse_jsonld_jobs(html, self.source)
        if not jobs:
            jobs = self._parse_dom(html)
        return jobs[:limit]

    def _parse_dom(self, html: str) -> list[ScrapedJob]:
        soup = BeautifulSoup(html, "lxml")
        cards = soup.select("div.job-card[data-job-key]")
        jobs: list[ScrapedJob] = []
        seen: set[str] = set()
        for card in cards:
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
        h3 = card.select_one("h3[data-search--job-selection-target='jobTitle'], h3.imt-3, h3")
        title = h3.get_text(strip=True) if h3 else ""
        if not title:
            return None
        data_url = (h3.get("data-url") if h3 else "") or ""
        if data_url:
            url = data_url.split("?")[0]
        else:
            slug = card.get("data-search--job-selection-job-slug-value") or ""
            url = f"{self.base_url}/it-jobs/{slug}" if slug else ""
        if not url:
            return None

        company = "Unknown"
        for a in card.select("a[href*='/companies/']"):
            t = a.get_text(strip=True)
            if t:
                company = t
                break

        loc_el = card.select_one("div.text-truncate.stretched-link, div[class*='text-truncate'][class*='stretched-link']")
        location = loc_el.get_text(strip=True) if loc_el else None

        skills = [a.get_text(strip=True) for a in card.select("a.itag")]
        skills = [s for s in skills if s][:15]

        job_key = card.get("data-job-key")
        slug_last = url.rstrip("/").split("/")[-1]
        mnum = re.search(r"(\d+)$", slug_last)
        external_id = (mnum.group(1) if mnum else None) or job_key or slug_last

        return ScrapedJob(
            external_id=external_id,
            source=self.source,
            title=title,
            company=company,
            url=url,
            location=location,
            salary_currency="VND",
            salary_negotiable=True,  # ITviec hides salary behind login
            skills_required=skills,
            raw_data={"source": self.source, "job_key": job_key},
        )

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        html = await firecrawl_scrape(f"{self.base_url}/it-jobs/{external_id}")
        if not html:
            return None
        jobs = parse_jsonld_jobs(html, self.source)
        return jobs[0] if jobs else None

    def _parse_salary_text(self, text: str) -> tuple[Optional[int], Optional[int]]:
        if not text or "negotiate" in text.lower() or "thỏa thuận" in text.lower():
            return None, None
        nums = re.findall(r"[\d,\.]+", text)
        parsed = []
        for n in nums:
            try:
                parsed.append(float(n.replace(",", "")))
            except ValueError:
                continue
        if not parsed:
            return None, None
        multiplier = 1_000_000 if "triệu" in text.lower() else (1000 if "$" in text else 1)
        vals = sorted(int(p * multiplier) for p in parsed)
        return vals[0], vals[-1] if len(vals) > 1 else vals[0]
