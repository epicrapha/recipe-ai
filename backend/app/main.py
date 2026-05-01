"""
FastAPI application entry point.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .engine import engine
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load ML models
    engine.load()
    yield
    # Shutdown: nothing to cleanup


app = FastAPI(
    title="Recipe Recommendation API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        os.environ.get("FRONTEND_URL", ""),
        # Vercel preview URLs
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
