from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_supabase_public_client():
    from supabase import create_client

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache(maxsize=1)
def get_supabase_service_client():
    from supabase import create_client

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def clear_supabase_client_cache() -> None:
    get_supabase_public_client.cache_clear()
    get_supabase_service_client.cache_clear()
