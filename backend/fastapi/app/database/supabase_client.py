import os

from dotenv import load_dotenv
from supabase import create_client, Client


# Load environment variables from .env
load_dotenv()


# =========================
# SUPABASE CONFIGURATION
# =========================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


# =========================
# CHECK ENVIRONMENT VARIABLES
# =========================

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing")

if not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_KEY is missing")

if not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_ANON_KEY is missing")


# =========================
# DATABASE CLIENT
# =========================
# Used by backend for database operations

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)


# =========================
# AUTHENTICATION CLIENT
# =========================
# Used for signup/login

supabase_auth: Client = create_client(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
)