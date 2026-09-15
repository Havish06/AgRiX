from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    await init_db()
    yield
    await close_db()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AgRiX: Uncertainty-Aware Agricultural Credit Risk Framework",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        return {"status": "healthy", "version": settings.APP_VERSION}

    # API routers will be included here
    # from app.api import data, statistics, models, predictions, forecast, scenarios, explanations, research
    # app.include_router(data.router, prefix=f"{settings.API_PREFIX}/data", tags=["Data"])
    # app.include_router(statistics.router, prefix=f"{settings.API_PREFIX}/statistics", tags=["Statistics"])
    # app.include_router(models.router, prefix=f"{settings.API_PREFIX}/models", tags=["Models"])
    # app.include_router(predictions.router, prefix=f"{settings.API_PREFIX}/predictions", tags=["Predictions"])
    # app.include_router(forecast.router, prefix=f"{settings.API_PREFIX}/forecast", tags=["Forecast"])
    # app.include_router(scenarios.router, prefix=f"{settings.API_PREFIX}/scenarios", tags=["Scenarios"])
    # app.include_router(explanations.router, prefix=f"{settings.API_PREFIX}/explanations", tags=["Explanations"])
    # app.include_router(research.router, prefix=f"{settings.API_PREFIX}/research", tags=["Research"])

    return app


app = create_app()