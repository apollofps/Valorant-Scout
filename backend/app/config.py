"""Configuration management for VALORANT Scout."""
from functools import lru_cache
from typing import Literal

from pydantic import Field
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
        """Always False: use base model API (temperature, max_tokens) only, no thinking/reasoning models."""
        return False
    
    # Application
    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"
    # Store CORS_ORIGINS as string so pydantic-settings doesn't JSON-parse it (URLs are not valid JSON).
    cors_origins_env: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        validation_alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS_ORIGINS (comma-separated) into a list."""
        s = (self.cors_origins_env or "").strip()
        if not s or s in ("[]", "null"):
            return ["http://localhost:5173", "http://localhost:3000"]
        return [x.strip() for x in s.split(",") if x.strip()]

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
