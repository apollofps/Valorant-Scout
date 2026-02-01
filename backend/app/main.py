"""FastAPI application entrypoint for VALORANT Scout."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import get_settings
from app.api.routes import reports, teams

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    logger.info("🎮 VALORANT Scout starting up...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"LLM Provider: {settings.llm_provider}")
    yield
    logger.info("👋 VALORANT Scout shutting down...")


app = FastAPI(
    title="VALORANT Scout API",
    description="Automated scouting report generator for competitive VALORANT teams",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "VALORANT Scout API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "grid_api": "configured" if settings.grid_api_key else "missing",
        "llm": "configured" if (settings.anthropic_api_key or settings.openai_api_key) else "missing"
    }
