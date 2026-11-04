from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.api.endpoints import api_router, UPLOAD_DIR

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Road Flood Intelligence and Emergency Route Management Platform for Mangaluru, Karnataka.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mount for uploaded photographs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to NEERPATH API - Mangaluru AI Road Flood Intelligence",
        "tagline": settings.TAGLINE,
        "docs": "/docs",
        "health": "/api/health"
    }
