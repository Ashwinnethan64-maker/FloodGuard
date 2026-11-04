"""
Supabase client helper for NEERPATH backend.
Handles database queries, authentication verification, and Storage bucket interactions
using service-role privileges where authorized.
"""
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client = None

def get_supabase_client():
    """
    Returns an initialized Supabase Python client instance, or None if credentials are not configured
    or connection cannot be initialized.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = settings.SUPABASE_URL
    # Prefer secret key on backend for admin tasks, fallback to key
    supabase_key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_KEY or settings.SUPABASE_PUBLISHABLE_KEY

    if not supabase_url or not supabase_key:
        logger.warning("Supabase URL or Key not set in environment. Running in offline/local mode.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Supabase Python Client successfully initialized.")
        return _supabase_client
    except Exception as exc:
        logger.error(f"Failed to initialize Supabase client: {exc}")
        return None

def upload_incident_photo_to_storage(
    file_bytes: bytes,
    file_name: str,
    content_type: str = "image/jpeg",
    bucket_name: str = "incident-photos"
) -> Optional[str]:
    """
    Uploads a photo to the Supabase Storage bucket 'incident-photos' and returns its public URL.
    Returns None if upload fails or Supabase is not available.
    """
    client = get_supabase_client()
    if not client:
        return None

    try:
        # Upload file bytes to the bucket
        response = client.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        # Obtain public URL
        public_url_res = client.storage.from_(bucket_name).get_public_url(file_name)
        return public_url_res
    except Exception as exc:
        logger.warning(f"Supabase Storage upload warning for {file_name}: {exc}")
        return None

