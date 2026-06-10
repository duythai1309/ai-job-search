import pytest

from app.core.config import ConfigError, clear_settings_cache, get_settings


@pytest.fixture(autouse=True)
def reset_config_cache():
    clear_settings_cache()
    yield
    clear_settings_cache()


def test_get_settings_reads_required_supabase_env(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon-key")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")

    settings = get_settings()

    assert settings.supabase_url == "https://example.supabase.co"
    assert settings.supabase_anon_key == "anon-key"
    assert settings.supabase_service_role_key == "service-role-key"


@pytest.mark.parametrize(
    "missing_var",
    [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
    ],
)
def test_get_settings_fails_closed_when_required_env_missing(monkeypatch, missing_var):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon-key")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    monkeypatch.delenv(missing_var, raising=False)

    with pytest.raises(ConfigError) as exc_info:
        get_settings()

    message = str(exc_info.value)
    assert missing_var in message
    assert "https://example.supabase.co" not in message
    assert "anon-key" not in message
    assert "service-role-key" not in message
