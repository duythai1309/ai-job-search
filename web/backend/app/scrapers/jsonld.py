from __future__ import annotations
import json
import re
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from .base import ScrapedJob

# Most job boards embed a schema.org JobPosting in <script type="application/ld+json">.
# Parsing that is far more stable than CSS selectors, so we try it first.

_EMP_MAP = {
    "full-time": "full-time", "fulltime": "full-time", "full time": "full-time",
    "part-time": "part-time", "parttime": "part-time", "part time": "part-time",
    "contract": "contract", "contractor": "contract", "temporary": "contract",
    "intern": "internship", "internship": "internship",
    "freelance": "freelance",
}


def _to_int(v) -> Optional[int]:
    try:
        if v is None:
            return None
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _parse_date(v) -> Optional[datetime]:
    if not v or not isinstance(v, str):
        return None
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        pass
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(v[: len(fmt) + 2], fmt)
        except ValueError:
            continue
    return None


def _norm_emp(emp) -> Optional[str]:
    if isinstance(emp, list):
        emp = emp[0] if emp else None
    if not emp or not isinstance(emp, str):
        return None
    return _EMP_MAP.get(emp.strip().lower().replace("_", "-"))


def _walk(node, out: list):
    if isinstance(node, dict):
        t = node.get("@type")
        types = t if isinstance(t, list) else [t]
        if "JobPosting" in types:
            out.append(node)
        for v in node.values():
            _walk(v, out)
    elif isinstance(node, list):
        for item in node:
            _walk(item, out)


def parse_jsonld_jobs(html: str, source: str) -> list[ScrapedJob]:
    soup = BeautifulSoup(html, "lxml")
    postings: list[dict] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        raw = tag.string or tag.get_text() or ""
        if "JobPosting" not in raw:
            continue
        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            continue
        _walk(data, postings)

    jobs: list[ScrapedJob] = []
    seen: set[str] = set()
    for p in postings:
        try:
            job = _jsonld_to_job(p, source)
        except Exception:
            continue
        if job.url in seen:
            continue
        seen.add(job.url)
        jobs.append(job)
    return jobs


def _jsonld_to_job(p: dict, source: str) -> ScrapedJob:
    title = (p.get("title") or "").strip()

    org = p.get("hiringOrganization") or {}
    if isinstance(org, dict):
        company = (org.get("name") or "").strip() or "Unknown"
        logo = org.get("logo")
        logo = logo.get("url") if isinstance(logo, dict) else (logo if isinstance(logo, str) else None)
    else:
        company, logo = str(org) or "Unknown", None

    url = p.get("url") or p.get("@id") or ""

    location = None
    loc = p.get("jobLocation")
    if isinstance(loc, list) and loc:
        loc = loc[0]
    if isinstance(loc, dict):
        addr = loc.get("address")
        if isinstance(addr, dict):
            location = addr.get("addressLocality") or addr.get("addressRegion") or addr.get("streetAddress")
        elif isinstance(addr, str):
            location = addr

    sal_min = sal_max = None
    bs = p.get("baseSalary")
    if isinstance(bs, dict):
        val = bs.get("value")
        if isinstance(val, dict):
            sal_min = _to_int(val.get("minValue") if val.get("minValue") is not None else val.get("value"))
            sal_max = _to_int(val.get("maxValue") if val.get("maxValue") is not None else val.get("value"))
        else:
            sal_min = _to_int(val)

    desc = p.get("description") or ""
    if desc:
        desc = BeautifulSoup(desc, "lxml").get_text("\n", strip=True)

    skills = p.get("skills")
    if isinstance(skills, str):
        skills = [s.strip() for s in re.split(r"[,;/]", skills) if s.strip()]
    elif not isinstance(skills, list):
        skills = []

    external_id = url.rstrip("/").split("/")[-1] if url else title.lower().replace(" ", "-")[:80]

    return ScrapedJob(
        external_id=external_id or "unknown",
        source=source,
        title=title or "Unknown",
        company=company,
        url=url,
        location=location,
        is_remote=bool(location and "remote" in str(location).lower()),
        description=desc or None,
        salary_min=sal_min,
        salary_max=sal_max,
        salary_currency="VND",
        salary_negotiable=not (sal_min or sal_max),
        employment_type=_norm_emp(p.get("employmentType")),
        skills_required=skills,
        company_logo_url=logo,
        posted_at=_parse_date(p.get("datePosted")),
        deadline=_parse_date(p.get("validThrough")),
        raw_data={"source": source, "via": "jsonld"},
    )
