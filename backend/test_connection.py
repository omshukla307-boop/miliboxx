import os
import sys
from dotenv import load_dotenv

# Ensure UTF-8 output for Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()


def test_supabase_connection():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    print("==========================================")
    print("   Military Box Supabase Connection Test  ")
    print("==========================================")
    print(f"Supabase Target URL : {url}")
    print(f"Key Configured      : {'Yes' if key else 'No'}\n")
    
    if not url or "YOUR_SUPABASE" in url:
        print("❌ Action Required: Please verify SUPABASE_URL in your .env file!")
        return False
        
    try:
        from supabase import create_client
        supabase = create_client(url, key)
        print("✅ Supabase Python SDK Client initialized successfully!")
        
        # Test basic connection ping (try fetching from devices table)
        print("Testing query connection to Supabase database...")
        try:
            res = supabase.table("devices").select("*").limit(5).execute()
            print(f"✅ Supabase Table 'devices' query successful! Rows retrieved: {len(res.data)}")
        except Exception as q_err:
            print(f"⚠️  Supabase connected, but 'devices' table check returned: {q_err}")
            print("👉  Have you executed 'schema.sql' in your Supabase SQL Editor?")
            print("    Link: https://supabase.com/dashboard/project/fpxpyvfeionyxfptigmy/sql")

        return True
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

if __name__ == "__main__":
    test_supabase_connection()
