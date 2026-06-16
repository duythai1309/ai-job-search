from __future__ import annotations
import re
from typing import Optional
from urllib.parse import urlencode

from bs4 import BeautifulSoup

from .base import BaseJobScraper, ScrapedJob
from .firecrawl_base import firecrawl_scrape
from .jsonld import parse_jsonld_jobs

CITY_MAP = {
    "hà nội": 1, "hanoi": 1, "hn": 1,
    "hồ chí minh": 2, "ho chi minh": 2, "hcm": 2, "tphcm": 2,
    "đà nẵng": 3, "da nang": 3,
    "cần thơ": 10, "can tho": 10,
    "bình dương": 57, "binh duong": 57,
}


class TopCVScraper(BaseJobScraper):
    source = "topcv"
    base_url = "https://www.topcv.vn"

    def _search_url(self, query: str, location: str, page: int) -> str:
        city_id = CITY_MAP.get(location.lower().strip()) if location else None
        params: dict = {"q": query}
        if page > 1:
            params["page"] = page
        if city_id:
            params["city_id"] = city_id
        return f"{self.base_url}/tim-viec-lam-tat-ca?{urlencode(params)}"

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
        cards = soup.select(
            "div.job-item-search-result, div.job-item, div[class*='job-item'], div[data-job-id]"
        )
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
        a = card.select_one("h3.title a, a[href*='/viec-lam/']")
        if not a:
            return None
        href = a.get("href", "")
        if not href:
            return None
        clean = href.split("?")[0]
        url = clean if clean.startswith("http") else f"{self.base_url}{clean}"
        img = card.select_one(".avatar img, img")
        title = (
            a.get_text(strip=True)
            or (img.get("title").strip() if img and img.get("title") else "")
            or (a.get("aria-label") or "").strip()
        )
        if not title:
            return None
        comp_el = card.select_one(".company-name, [class*='company-name']")
        company = (
            (comp_el.get_text(strip=True) if comp_el else "")
            or ((img.get("alt") or "").strip() if img else "")
            or "Unknown"
        )
        sal_el = card.select_one("label.title-salary, .title-salary, label.salary, [class*='salary']")
        salary_text = sal_el.get_text(strip=True) if sal_el else ""
        sal_min, sal_max = self._parse_salary_text(salary_text)
        loc_el = card.select_one(".city-text, [class*='city-text'], [class*='city'], [class*='address']")
        id_m = re.search(r"/(\d+)\.html", clean)
        external_id = card.get("data-job-id") or (id_m.group(1) if id_m else clean.rstrip("/").split("/")[-1])
        return ScrapedJob(
            external_id=external_id,
            source=self.source,
            title=title,
            company=company,
            url=url,
            location=loc_el.get_text(strip=True) if loc_el else None,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="VND",
            salary_negotiable="thỏa thuận" in salary_text.lower() or not salary_text,
            company_logo_url=img.get("src") if img else None,
            raw_data={"source": self.source, "id": external_id},
        )

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        html = await firecrawl_scrape(f"{self.base_url}/viec-lam/{external_id}.html")
        if not html:
            return None
        jobs = parse_jsonld_jobs(html, self.source)
        return jobs[0] if jobs else None

    def _parse_salary_text(self, text: str) -> tuple[Optional[int], Optional[int]]:
        if not text or "thỏa thuận" in text.lower():
            return None, None
        nums = re.findall(r"[\d\.]+", text.replace(",", "."))
        parsed = []
        for n in nums:
            try:
                parsed.append(float(n))
            except ValueError:
                continue
        if not parsed:
            return None, None
        multiplier = 1_000_000 if "triệu" in text.lower() or "tr" in text.lower() else 1
        vals = sorted(int(p * multiplier) for p in parsed)
        return vals[0], vals[-1] if len(vals) > 1 else vals[0]
