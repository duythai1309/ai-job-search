from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    gemini_api_key: str = ""  # optional: leave empty to run without AI features
    gemini_model: str = "gemini-2.5-flash-lite"

    # Firecrawl (hosted scraping) — used by JS-heavy scrapers (YBOX, Vieclam24h)
    firecrawl_api_key: str = ""
    firecrawl_api_url: str = "https://api.firecrawl.dev"

    frontend_url: str = "http://localhost:3000"
    environment: str = "development"


settings = Settings()
