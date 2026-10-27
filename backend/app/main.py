from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import router as api_router
from app.core.config import settings
from app.core.database import close_db, engine, init_db
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

    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.get("/api/health", tags=["Health"])
    async def health_check() -> dict[str, object]:
        database_status = "connected"
        try:
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except Exception:
            database_status = "disconnected"

        from app.services import store

        data_ready = store.snapshots_present()
        models_ready = bool(store.load_registry() or {})
        return {
            "status": "healthy" if database_status == "connected" else "degraded",
            "version": settings.APP_VERSION,
            "dependencies": {
                "database": database_status,
                "mlflow": "disconnected",
                "cache": "connected" if data_ready else "disconnected",
            },
            "pipeline": {
                "data_ingested": data_ready,
                "models_trained": models_ready,
            },
        }

    return app


app = create_app()
