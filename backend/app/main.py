from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from sqlalchemy import text

from app.api.v1.calendar import router as calendar_router
from app.api.v1.circuits import router as circuits_router
from app.api.v1.compare import router as compare_router
from app.api.v1.constructors import router as constructors_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.search import router as search_router
from app.core.config import get_settings
from app.core.database import engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    FastAPICache.init(InMemoryBackend(), prefix="f1-insight")
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Intelligent Formula One Analytics & Performance Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(dashboard_router)
app.include_router(drivers_router)
app.include_router(constructors_router)
app.include_router(circuits_router)
app.include_router(calendar_router)
app.include_router(compare_router)
app.include_router(search_router)


@app.get("/api/health", tags=["system"])
def health() -> dict:
    db_ok = True
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "up" if db_ok else "down",
        "version": settings.app_version,
    }
