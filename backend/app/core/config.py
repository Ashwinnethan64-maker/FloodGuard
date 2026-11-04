from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEERPATH"
    TAGLINE: str = "Know the road. Navigate the risk."
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        elif isinstance(v, list):
            return v
        return ["*"]
    
    # Database (PostgreSQL / Supabase direct connection)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/neerpath"
    
    # Supabase Cloud Integration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    
    # External Services
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_TIMEZONE: str = "auto"
    OPEN_METEO_FORECAST_DAYS: int = 7
    
    # HeiGIT / OpenRouteService Integration
    ORS_API_KEY: str = ""
    ORS_BASE_URL: str = "https://api.heigit.org/openrouteservice"
    
    # Mangaluru Coordinates baseline
    MANGALURU_LAT: float = 12.9141
    MANGALURU_LON: float = 74.8560
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
