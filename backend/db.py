import os
from supabase import create_client, Client

# Initialize Supabase Client
# Ensure SUPABASE_URL and SUPABASE_KEY are set in your environment variables (.env.local or Vercel)
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

if not url or not key:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment.")

supabase: Client = create_client(url, key)

def get_supabase():
    return supabase
