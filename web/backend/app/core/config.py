from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


REQUIRED_ENV_VARS = (
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
)


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class Settings:
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    enable_live_job_scraping: bool = False


@dataclass(frozen=True, slots=True)
class AISettings:
    provider: str | None
    gemini_api_key: str | None
    gemini_model: str | None
    timeout_seconds: float = 20.0


def _read_required_env(var_name: str) -> str:
    value = os.getenv(var_name, "").strip()
    if not value:
        raise ConfigError(f"Missing required environment variable: {var_name}")
    return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var, "").strip()]
    if missing:
        missing_list = ", ".join(missing)
        raise ConfigError(f"Missing required environment variables: {missing_list}")

    return Settings(
        supabase_url=_read_required_env("SUPABASE_URL"),
        supabase_anon_key=_read_required_env("SUPABASE_ANON_KEY"),
        supabase_service_role_key=_read_required_env("SUPABASE_SERVICE_ROLE_KEY"),
        enable_live_job_scraping=os.getenv(
            "ENABLE_LIVE_JOB_SCRAPING", ""
        ).strip().casefold()
        in {"1", "true", "yes", "on"},
    )


def clear_settings_cache() -> None:
    get_settings.cache_clear()
    get_ai_settings.cache_clear()


@lru_cache(maxsize=1)
def get_ai_settings() -> AISettings:
    provider = os.getenv("AI_PROVIDER", "").strip().casefold() or None
    timeout_raw = os.getenv("AI_TIMEOUT_SECONDS", "20").strip()
    try:
        timeout_seconds = float(timeout_raw)
    except ValueError as exc:
        raise ConfigError("AI_TIMEOUT_SECONDS must be a number.") from exc
    if timeout_seconds <= 0:
        raise ConfigError("AI_TIMEOUT_SECONDS must be greater than zero.")
    if provider is None:
        return AISettings(None, None, None, timeout_seconds)
    if provider != "gemini":
        raise ConfigError("AI_PROVIDER must be 'gemini' or unset.")
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "").strip()
    missing = [
        name
        for name, value in (
            ("GEMINI_API_KEY", api_key),
            ("GEMINI_MODEL", model),
        )
        if not value
    ]
    if missing:
        raise ConfigError(
            "Missing required AI environment variables: " + ", ".join(missing)
        )
    return AISettings(provider, api_key, model, timeout_seconds)
