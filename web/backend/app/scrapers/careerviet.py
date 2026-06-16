from __future__ import annotations
import re
from typing import Optional
from urllib.parse import quote

from bs4 import BeautifulSoup

from .base import BaseJobScraper, ScrapedJob
from .firecrawl_base import firecrawl_scrape
from .jsonld import parse_jsonld_jobs


class CareerVietScraper(BaseJobScraper):
    source = "careerviet"
    base_url = "https://careerviet.vn"

    def _search_url(self, query: str, page: int) -> str:
        return f"{self.base_url}/viec-lam/{quote(query)}-lv.html?page={page}"

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
        cards = soup.select("div.jobs-item, div.job-item, div[class*='job-item'], div[class*='job_']")
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
        title_el = card.select_one("h2 a, h3 a, a.job-title, a[href*='/viec-lam/']")
        if not title_el:
            return None
        href = title_el.get("href", "")
        if not href:
            return None
        url = href if href.startswith("http") else f"{self.base_url}{href}"
        title = title_el.get_text(strip=True)
        if not title:
            return None
        company_el = card.select_one("div.company a, span.company-name, a.company-name, [class*='company']")
        location_el = card.select_one("span.location, div.location, [class*='location'], [class*='address']")
        salary_el = card.select_one("span.salary, div.salary, [class*='salary']")
        slug = href.rstrip("/").split("/")[-1].replace(".html", "") if href else ""
        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        sal_min, sal_max = self._parse_salary(salary_text)
        return ScrapedJob(
            external_id=slug or title.lower().replace(" ", "-")[:80],
            source=self.source,
            title=title,
            company=company_el.get_text(strip=True) if company_el else "Unknown",
            url=url,
            location=location_el.get_text(strip=True) if location_el else None,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="VND",
            salary_negotiable="thỏa thuận" in salary_text.lower() or not salary_text,
            raw_data={"source": self.source},
        )

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        html = await firecrawl_scrape(f"{self.base_url}/viec-lam/{external_id}.html")
        if not html:
            return None
        jobs = parse_jsonld_jobs(html, self.source)
        return jobs[0] if jobs else None

    def _parse_salary(self, text: str) -> tuple[Optional[int], Optional[int]]:
        if not text or "thỏa thuận" in text.lower():
            return None, None
        nums = re.findall(r"[\d]+", text.replace(",", ""))
        if not nums:
            return None, None
        mult = 1_000_000 if "triệu" in text.lower() else 1
        vals = sorted(int(n) * mult for n in nums)
        return vals[0], vals[-1] if len(vals) > 1 else vals[0]
