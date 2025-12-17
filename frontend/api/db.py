import os
from supabase import create_client, Client

# Initialize Supabase Client
supabase: Client = None

def get_supabase():
    global supabase
    if supabase:
        return supabase

    # Ensure SUPABASE_URL and SUPABASE_KEY are set in your environment variables (.env.local or Vercel)
    # Fallback to NEXT_PUBLIC_ variants if standard ones are missing (Vercel often shares them)
    url: str = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    
    # CRITIAL: Backend needs SERVICE_ROLE_KEY to bypass RLS and verify owners.
    # If not found, fall back to Anon key (which might fail validation if RLS is on).
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

    if not url or not key:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment.")
        return None
        
    try:
        supabase = create_client(url, key)
        return supabase
    except Exception as e:
        print(f"Failed to create Supabase client: {e}")
        return None
