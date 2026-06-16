from __future__ import annotations
import re
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from .base import BaseJobScraper, ScrapedJob
from .firecrawl_base import firecrawl_scrape
from .jsonld import parse_jsonld_jobs

_SAL_NEG = ("thương lượng", "thỏa thuận", "thoả thuận", "cạnh tranh")


def _parse_salary(text: str) -> tuple[Optional[int], Optional[int], bool, str]:
    t = text.lower()
    if not text or any(k in t for k in _SAL_NEG):
        return None, None, True, "VND"
    currency = "USD" if ("$" in text or "usd" in t) else "VND"
    vals = []
    for n in re.findall(r"\d[\d.,]*", text):
        digits = n.replace(".", "").replace(",", "")
        if digits.isdigit():
            vals.append(int(digits))
    if not vals:
        return None, None, True, currency
    if "triệu" in t:
        vals = [v * 1_000_000 for v in vals]
    vals = sorted(vals)
    return vals[0], (vals[-1] if len(vals) > 1 else vals[0]), False, currency


class VietnamWorksScraper(BaseJobScraper):
    """VietnamWorks (vietnamworks.com) via Firecrawl.

    Result cards: div.view_job_item. Title in h2 a[href*='-jv'], company in
    a[href*='/nha-tuyen-dung/'], salary+location as sibling spans. Styled-
    components class names are hashed, so selection relies on stable signals.
    """

    source = "vietnamworks"
    base_url = "https://www.vietnamworks.com"

    def _search_url(self, query: str, page: int) -> str:
        url = f"{self.base_url}/viec-lam?q={quote_plus(query)}"
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
        cards = soup.select("div.view_job_item, div[class*='view_job_item']")
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
        a = card.select_one("h2 a[href*='-jv'], a.img_job_card[href*='-jv'], a[href*='-jv']")
        if not a:
            return None
        href = a.get("href", "")
        if not href:
            return None
        clean = href.split("?")[0]
        url = clean if clean.startswith("http") else f"{self.base_url}{clean}"
        title = a.get_text(strip=True) or (a.get("title") or "").strip()
        if not title:
            return None

        comp_el = card.select_one("a[href*='/nha-tuyen-dung/'], a[href*='/cong-ty/']")
        company = (comp_el.get_text(strip=True) if comp_el else "") or (comp_el.get("title").strip() if comp_el and comp_el.get("title") else "") or "Unknown"

        # Salary span (by content) + its sibling span = location
        sal_min = sal_max = None
        negotiable = True
        currency = "VND"
        location = None
        sal_span = None
        for sp in card.find_all("span"):
            txt = sp.get_text(strip=True)
            if not txt:
                continue
            if any(k in txt.lower() for k in _SAL_NEG) or "triệu" in txt.lower() or "$" in txt or "usd" in txt.lower() or re.search(r"\d{1,3}[.,]\d{3}", txt):
                sal_span = sp
                sal_min, sal_max, negotiable, currency = _parse_salary(txt)
                break
        if sal_span is not None:
            sibs = sal_span.parent.find_all("span", recursive=False)
            others = [s.get_text(strip=True) for s in sibs if s is not sal_span and s.get_text(strip=True)]
            if others:
                location = others[-1]

        id_m = re.search(r"-(\d+)-jv", clean)
        external_id = id_m.group(1) if id_m else clean.rstrip("/").split("/")[-1]

        return ScrapedJob(
            external_id=external_id,
            source=self.source,
            title=title,
            company=company,
            url=url,
            location=location,
            is_remote=bool(location and "remote" in location.lower()),
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency=currency,
            salary_negotiable=negotiable,
            raw_data={"source": self.source, "id": external_id},
        )

    async def get_detail(self, external_id: str) -> Optional[ScrapedJob]:
        html = await firecrawl_scrape(f"{self.base_url}/{external_id}")
        if not html:
            return None
        jobs = parse_jsonld_jobs(html, self.source)
        return jobs[0] if jobs else None
