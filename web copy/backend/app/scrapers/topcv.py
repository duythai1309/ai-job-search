from __future__ import annotations
import re
from datetime import datetime
from typing import Optional
from urllib.parse import urlencode

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import BaseJobScraper, ScrapedJob

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Referer": "https://www.topcv.vn/",
    "X-Requested-With": "XMLHttpRequest",
}

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

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        city_id = CITY_MAP.get(location.lower().strip()) if location else None
        params = {"q": query, "page": page}
        if city_id:
            params["city_id"] = city_id

        url = f"{self.base_url}/tim-viec-lam-tat-ca?{urlencode(params)}"
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select("div.job-item-search-result, div.job-item")[:limit]
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
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "lxml")
        return self._parse_detail(soup, external_id, url)

    def _parse_card(self, card) -> ScrapedJob:
        title_el = card.select_one("h3.title a, a.title, h2.title")
        company_el = card.select_one("a.company, div.company-name a, span.company")
        location_el = card.select_one("label.address, div.address, span.address")
        salary_el = card.select_one("label.salary, div.salary, span.salary")
        logo_el = card.select_one("img.logo, img.company-logo")
        href = title_el.get("href", "") if title_el else ""
        url = href if href.startswith("http") else f"{self.base_url}{href}"
        slug = re.search(r"/viec-lam/(.+?)(?:\.html)?$", href)
        external_id = slug.group(1) if slug else href.split("/")[-1]

        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        sal_min, sal_max = self._parse_salary_text(salary_text)

        return ScrapedJob(
            external_id=external_id,
            source=self.source,
            title=title_el.get_text(strip=True) if title_el else "Unknown",
            company=company_el.get_text(strip=True) if company_el else "Unknown",
            url=url,
            location=location_el.get_text(strip=True) if location_el else None,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="VND",
            salary_negotiable="thỏa thuận" in salary_text.lower() or "negotiate" in salary_text.lower(),
            company_logo_url=logo_el.get("src") if logo_el else None,
            raw_data={"source": self.source, "id": external_id},
        )

    def _parse_detail(self, soup, external_id: str, url: str) -> ScrapedJob:
        title = soup.select_one("h1.title-job, h1.job-title")
        company = soup.select_one("a.company-name, div.company-name h2")
        desc_el = soup.select_one("div.job-description, div#job-detail-info")
        location_el = soup.select_one("div.job-info span.address, li.address span")
        salary_el = soup.select_one("div.job-info span.salary, li.salary span")
        deadline_el = soup.select_one("span.deadline, div.deadline span")
        tags = soup.select("div.tag-list a, span.tag")

        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        sal_min, sal_max = self._parse_salary_text(salary_text)

        return ScrapedJob(
            external_id=external_id,
            source=self.source,
            title=title.get_text(strip=True) if title else external_id,
            company=company.get_text(strip=True) if company else "Unknown",
            url=url,
            location=location_el.get_text(strip=True) if location_el else None,
            description=desc_el.get_text(separator="\n", strip=True) if desc_el else None,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="VND",
            salary_negotiable="thỏa thuận" in salary_text.lower(),
            skills_required=[t.get_text(strip=True) for t in tags],
            raw_data={"source": self.source, "id": external_id},
        )

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
