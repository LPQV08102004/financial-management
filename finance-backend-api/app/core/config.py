from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "mysql+pymysql://finuser:finpass@mysql:3306/financedb"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24
    refresh_token_expire_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()