from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger("military_box")

_supabase_instance: Client = None

def get_supabase_client() -> Client:
    global _supabase_instance
    if _supabase_instance is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY
        
        if not url or "YOUR_SUPABASE" in url:
            raise ValueError("SUPABASE_URL is invalid or missing in configuration.")
        if not key:
            raise ValueError("SUPABASE_KEY is missing in configuration.")
            
        logger.info(f"Initializing Supabase Client -> {url}")
        _supabase_instance = create_client(url, key)
        
    return _supabase_instance
