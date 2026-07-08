from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Racecraft"
    app_version: str = "0.1.0"
    debug: bool = False

    database_url: str = "postgresql+psycopg://f1app:f1app_dev_password@localhost:5432/f1_insight"

    # Comma-separated browser origins allowed by CORS. In production set
    # CORS_ORIGINS to your deployed frontend, e.g. "https://racecraft.vercel.app"
    # (multiple allowed, comma-separated). Read as a list via `cors_origin_list`.
    cors_origins: str = "http://localhost:3000"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    # Optional: activates the Claude insights provider when set
    anthropic_api_key: str | None = None

    cache_ttl_seconds: int = 300

    @property
    def cors_origin_list(self) -> list[str]:
        """Allowlist for CORSMiddleware, parsed from the comma-separated setting."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
