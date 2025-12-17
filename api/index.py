from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
import html
import random
from datetime import datetime
import uuid
import hashlib
import shutil
import aiofiles
import httpx
from urllib.parse import urlparse
import ipaddress
from db import get_supabase

# Initialize Supabase
supabase_client = get_supabase()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.http_client = httpx.AsyncClient(follow_redirects=True)
    yield
    # Shutdown
    await app.state.http_client.aclose()

app = FastAPI(title="Boundless Domain API", version="1.0.0", lifespan=lifespan)

# --- CORS ---
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://bobbyyu.me",
    "https://www.bobbyyu.me",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def process_url(url):
    """
    If URL starts with http, keep it.
    If it's a relative path in Supabase, prepend storage URL (requires configuration).
    For now, assume user provides full URLs or we prepend a placeholder.
    """
    if not url:
        return ""
    if url.startswith("http"):
        return url
    # return f"https://[YOUR_PROJECT].supabase.co/storage/v1/object/public/gallery/{url}"
    return url 

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "active", "message": "Welcome to the Boundless Domain API"}

# --- Navigation ---
class NavItem(BaseModel):
    label: str
    iconName: str
    href: str

class NavigationData(BaseModel):
    leftNavItems: List[NavItem]
    rightNavItems: List[NavItem]
    isDebugMode: bool = False

@app.get("/api/navigation")
def get_navigation():
    try:
        left_res = supabase_client.table("navigation").select("*").eq("side", "left").order("sort_order").execute()
        right_res = supabase_client.table("navigation").select("*").eq("side", "right").order("sort_order").execute()
        
        debug_res = supabase_client.table("site_settings").select("value").eq("key", "isDebugMode").execute()
        is_debug = False
        if debug_res.data:
            is_debug = debug_res.data[0]["value"]
            
        return {
            "leftNavItems": left_res.data,
            "rightNavItems": right_res.data,
            "isDebugMode": is_debug
        }
    except Exception as e:
        print(f"Error loading navigation: {e}")
        return {"leftNavItems": [], "rightNavItems": [], "isDebugMode": False}

@app.post("/api/navigation")
def update_navigation(data: NavigationData):
    try:
        supabase_client.table("site_settings").upsert({"key": "isDebugMode", "value": data.isDebugMode}).execute()
        
        # Replace Left
        supabase_client.table("navigation").delete().eq("side", "left").execute()
        if data.leftNavItems:
            left_inserts = [{"side": "left", "sort_order": i, "label": item.label, "icon_name": item.iconName, "href": item.href} for i, item in enumerate(data.leftNavItems)]
            supabase_client.table("navigation").insert(left_inserts).execute()

        # Replace Right
        supabase_client.table("navigation").delete().eq("side", "right").execute()
        if data.rightNavItems:
            right_inserts = [{"side": "right", "sort_order": i, "label": item.label, "icon_name": item.iconName, "href": item.href} for i, item in enumerate(data.rightNavItems)]
            supabase_client.table("navigation").insert(right_inserts).execute()

        return {"status": "success"}
    except Exception as e:
        print(f"Error saving navigation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Owner Verification ---
class VerifyOwnerRequest(BaseModel):
    id: str # User UUID
    email: Optional[str] = None # Backwards compatibility/logging

@app.post("/api/verify-owner")
def verify_owner(req: VerifyOwnerRequest):
    try:
        if req.email:
            normalized_email = req.email.lower().strip()
            # 1. Hardcoded Allowlist (Bootstrapping / Super Admin)
            ADMIN_EMAILS = ["home.bobbyyu@gmail.com"]
            if normalized_email in [e.lower() for e in ADMIN_EMAILS]:
                return {"isOwner": True}

        # 2. Database Role (Future Scalability)
        # For other users, we check the 'is_admin' flag in the 'profiles' table.
        # This allows you to manage admins via Supabase dashboard without code changes.
        # Check profiles table in Supabase
        # We use the 'id' (UUID) to query the profile
        res = supabase_client.table("profiles").select("is_admin").eq("id", req.id).execute()
        
        if res.data and len(res.data) > 0:
            is_admin = res.data[0].get("is_admin", False)
            return {"isOwner": is_admin}
            
        # Fallback: If no profile found (e.g. trigger didn't run), not an owner.
        return {"isOwner": False}
    except Exception as e:
        print(f"Owner verify error: {e}")
        return {"isOwner": False}

# --- Gallery ---
@app.get("/api/gallery")
def get_photos():
    try:
        res = supabase_client.table("albums").select("*, photos(*)").execute()
        albums = res.data if res.data else []
        
        all_photos = []
        
        # Sort by date label (simple string sort fallback)
        # In production, use real dates.
        
        final_albums = []
        for a in albums:
            mapped_album = {
                "id": a["id"],
                "title": a["title"],
                "coverUrl": process_url(a.get("cover_url")),
                "date": a.get("date_label"),
                "photos": []
            }
            for p in a.get("photos", []):
                p_url = process_url(p["url"])
                mapped_album["photos"].append({
                    "id": p["id"],
                    "url": p_url,
                    "type": p.get("type", "image")
                })
                all_photos.append({
                    "id": p["id"],
                    "type": p.get("type", "image"),
                    "url": p_url,
                    "caption": a["title"],
                    "albumId": a["id"]
                })
            final_albums.append(mapped_album)

        highlights = []
        if all_photos:
            seed_res = supabase_client.table("site_settings").select("value").eq("key", "shuffleSeed").execute()
            if seed_res.data:
                random.seed(seed_res.data[0]["value"])
            else:
                random.seed(int(datetime.now().strftime("%Y%m%d")))
            
            count = min(len(all_photos), 3)
            highlights = random.sample(all_photos, count)
            random.seed()

        return {"highlights": highlights, "albums": final_albums}
    except Exception as e:
        print(f"Gallery Error: {e}")
        return {"highlights": [], "albums": []}

@app.post("/api/gallery/highlights/shuffle")
def shuffle_highlights():
    try:
        new_seed = random.randint(1, 1000000)
        supabase_client.table("site_settings").upsert({"key": "shuffleSeed", "value": new_seed}).execute()
        return {"status": "success", "seed": new_seed}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Proxy ---
@app.get("/api/proxy")
async def proxy_image(url: str, request: Request):
    # Simple redirect proxy for now to save bandwidth/complexity on Vercel
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")
    return RedirectResponse(url=url)
