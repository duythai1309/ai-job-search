from __future__ import annotations
import re
from datetime import datetime
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import BaseJobScraper, ScrapedJob

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "vi-VN,vi;q=0.9",
}


class ITviecScraper(BaseJobScraper):
    source = "itviec"
    base_url = "https://itviec.com"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def search(self, query: str, location: str = "", page: int = 1, limit: int = 20) -> list[ScrapedJob]:
        loc_slug = ""
        if location:
            loc_lower = location.lower()
            if "hà nội" in loc_lower or "hanoi" in loc_lower or "hn" in loc_lower:
                loc_slug = "ha-noi"
            elif "hồ chí minh" in loc_lower or "hcm" in loc_lower or "tphcm" in loc_lower:
                loc_slug = "ho-chi-minh-city"
            elif "đà nẵng" in loc_lower or "da nang" in loc_lower:
                loc_slug = "da-nang"

        url = f"{self.base_url}/it-jobs/{quote(query.replace(' ', '-'))}"
        if loc_slug:
            url += f"-{loc_slug}"
        url += f"?page={page}"

        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        job_cards = soup.select("div.job_content")[:limit]
        jobs: list[ScrapedJob] = []
        for card in job_cards:
            try:
                jobs.append(self._parse_card(card))
            except Exception:
                continue
        return jobs

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        url = f"{self.base_url}/it-jobs/{external_id}"
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
        soup = BeautifulSoup(resp.text, "lxml")
        return self._parse_detail(soup, external_id, url)

    def _parse_card(self, card) -> ScrapedJob:
        title_el = card.select_one("h2.title a, h3.title a")
        company_el = card.select_one("div.employer-name a, a.employer-name")
        location_el = card.select_one("div.address, span.address")
        salary_el = card.select_one("div.salary, span.salary")
        skills_els = card.select("a.tag-name, span.tag")
        link_el = card.select_one("h2.title a, h3.title a")

        title = title_el.get_text(strip=True) if title_el else "Unknown"
        company = company_el.get_text(strip=True) if company_el else "Unknown"
        location = location_el.get_text(strip=True) if location_el else None
        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        skills = [s.get_text(strip=True) for s in skills_els]
        href = link_el.get("href", "") if link_el else ""
        url = href if href.startswith("http") else f"{self.base_url}{href}"
        slug = href.rstrip("/").split("/")[-1] if href else title.lower().replace(" ", "-")

        sal_min, sal_max = self._parse_salary_text(salary_text)

        return ScrapedJob(
            external_id=slug,
            source=self.source,
            title=title,
            company=company,
            url=url,
            location=location,
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="USD" if "$" in salary_text else "VND",
            salary_negotiable="negotiate" in salary_text.lower() or "thỏa thuận" in salary_text.lower(),
            skills_required=skills,
            raw_data={"source": self.source, "slug": slug},
        )

    def _parse_detail(self, soup, slug: str, url: str) -> ScrapedJob:
        title = soup.select_one("h1.title, h1.job-title")
        company = soup.select_one("a.employer-name, div.employer-name")
        desc_el = soup.select_one("div#content-tab, div.job-description")
        skills_els = soup.select("a.tag-name, div.job-tags a")
        location_el = soup.select_one("div.address span, li.address")

        return ScrapedJob(
            external_id=slug,
            source=self.source,
            title=title.get_text(strip=True) if title else slug,
            company=company.get_text(strip=True) if company else "Unknown",
            url=url,
            location=location_el.get_text(strip=True) if location_el else None,
            description=desc_el.get_text(separator="\n", strip=True) if desc_el else None,
            skills_required=[s.get_text(strip=True) for s in skills_els],
            raw_data={"source": self.source, "slug": slug},
        )

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
