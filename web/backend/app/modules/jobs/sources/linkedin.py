from app.modules.jobs.sources.base import DisabledLiveSource


class LinkedInSource(DisabledLiveSource):
    name = "linkedin"
    reason = "LinkedIn live scraping is disabled; use manual import or an approved API."
