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
    )


def clear_settings_cache() -> None:
    get_settings.cache_clear()
