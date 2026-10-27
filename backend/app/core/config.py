from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "AgRiX"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./AgRiX.db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # Data Providers
    FAOSTAT_API_KEY: str = ""
    FAOSTAT_BASE_URL: str = "https://fenixservices.fao.org/faostat/api/v1"
    NOAA_API_KEY: str = ""
    NOAA_BASE_URL: str = "https://www.ncei.noaa.gov/access/services/data/v1"
    NASA_POWER_BASE_URL: str = "https://power.lrc.nasa.gov/api"
    CDS_API_KEY: str = ""
    CDS_BASE_URL: str = "https://cds.climate.copernicus.eu/api/v2"
    ALPHA_VANTAGE_API_KEY: str = ""

    # ML/Experiments
    MLFLOW_TRACKING_URI: str = "file:./mlruns"
    MLFLOW_EXPERIMENT_NAME: str = "AgRiX"
    RANDOM_SEED: int = 42

    # Model Registry
    MODEL_REGISTRY_PATH: str = "./model_registry"

    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "json"

    # Cache
    CACHE_DIR: str = "./cache"
    CACHE_TTL_HOURS: int = 24

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
