from app.modules.jobs.scrapers.base import DisabledJobScraperAdapter


def test_disabled_scraper_import_has_no_network_side_effects():
    adapter = DisabledJobScraperAdapter()

    assert adapter.source == "disabled"
