from __future__ import annotations
import re
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import BaseJobScraper, ScrapedJob

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "vi-VN,vi;q=0.9",
}


class CareerVietScraper(BaseJobScraper):
    source = "careerviet"
    base_url = "https://careerviet.vn"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        q = quote(query)
        url = f"{self.base_url}/viec-lam/{q}-lv.html?page={page}"
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select("div.jobs-item, div.job-item")[:limit]
        jobs = []
        for card in cards:
            try:
                jobs.append(self._parse_card(card))
            except Exception:
                continue
        return jobs

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        url = f"{self.base_url}/viec-lam/{external_id}.html"
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
        soup = BeautifulSoup(resp.text, "lxml")
        return self._parse_detail(soup, external_id, url)

    def _parse_card(self, card) -> ScrapedJob:
        title_el = card.select_one("h2 a, h3 a, a.job-title")
        company_el = card.select_one("div.company a, span.company-name, a.company-name")
        location_el = card.select_one("span.location, div.location")
        salary_el = card.select_one("span.salary, div.salary")
        href = title_el.get("href", "") if title_el else ""
        url = href if href.startswith("http") else f"{self.base_url}{href}"
        slug = href.rstrip("/").split("/")[-1].replace(".html", "") if href else ""
        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        sal_min, sal_max = self._parse_salary(salary_text)

        return ScrapedJob(
            external_id=slug or title_el.get_text(strip=True).lower().replace(" ", "-") if title_el else "unknown",
            source=self.source,
            title=title_el.get_text(strip=True) if title_el else "Unknown",
            company=company_el.get_text(strip=True) if company_el else "Unknown",
            url=url,
            location=location_el.get_text(strip=True) if location_el else None,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="VND",
            salary_negotiable="thỏa thuận" in salary_text.lower(),
            raw_data={"source": self.source},
        )

    def _parse_detail(self, soup, external_id: str, url: str) -> ScrapedJob:
        title = soup.select_one("h1.title, h1.job-title")
        company = soup.select_one("div.company-name a, h2.company-name")
        desc_el = soup.select_one("div.full-content, div.job-detail")
        location_el = soup.select_one("div.job-info li.address span, span.address")

        return ScrapedJob(
            external_id=external_id,
            source=self.source,
            title=title.get_text(strip=True) if title else external_id,
            company=company.get_text(strip=True) if company else "Unknown",
            url=url,
            location=location_el.get_text(strip=True) if location_el else None,
            description=desc_el.get_text(separator="\n", strip=True) if desc_el else None,
            raw_data={"source": self.source, "id": external_id},
        )

    def _parse_salary(self, text: str) -> tuple[Optional[int], Optional[int]]:
        if not text or "thỏa thuận" in text.lower():
            return None, None
        nums = re.findall(r"[\d]+", text.replace(",", ""))
        if not nums:
            return None, None
        mult = 1_000_000 if "triệu" in text.lower() else 1
        vals = sorted(int(n) * mult for n in nums)
        return vals[0], vals[-1] if len(vals) > 1 else vals[0]
