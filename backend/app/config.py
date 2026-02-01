"""Configuration management for VALORANT Scout."""
from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        # Single source: repo root .env (when run from backend/). Do not use backend/.env.
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # GRID API
    grid_api_key: str = ""
    grid_api_url: str = "https://api-op.grid.gg/central-data/graphql"
    grid_series_state_url: str = "https://api-op.grid.gg/live-data-feed/series-state/graphql"
    grid_file_download_url: str = "https://api.grid.gg"  # Different base URL for file downloads
    
    # LLM Configuration
    llm_provider: Literal["anthropic", "openai"] = "openai"  # Default to OpenAI
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = ""  # Auto-selected based on provider
    
    @property
    def effective_llm_model(self) -> str:
        """Get the LLM model, auto-selecting based on provider if not set."""
        if self.llm_model:
            return self.llm_model
        # Default models per provider
        if self.llm_provider == "openai":
            return "gpt-4o-mini"  # Fast and capable
        return "claude-3-5-sonnet-20241022"
    
    @property
    def is_thinking_model(self) -> bool:
        """Check if the current model is a thinking model (o1 series or gpt-5.x series)."""
        model = self.effective_llm_model.lower()
        return model.startswith("o1-") or model.startswith("gpt-5") or "thinking" in model
    
    # Application
    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):  # noqa: ANN001
        """Allow CORS_ORIGINS from env as comma-separated string."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # Redis (optional caching)
    redis_url: str = "redis://localhost:6379"
    cache_ttl_seconds: int = 3600  # 1 hour
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

def clear_settings_cache():
    """Clear the settings cache to reload from .env file."""
    get_settings.cache_clear()
