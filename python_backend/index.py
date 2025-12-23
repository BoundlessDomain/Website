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
import sys
import traceback

STARTUP_ERROR = None

try:
    # Try importing from local directory first
    try:
        from db import get_supabase
    except ImportError:
        # Fallback for some Vercel environments where .api might be needed
        from python_backend.db import get_supabase
except Exception as e:
    STARTUP_ERROR = f"Import Error: {e}\n{traceback.format_exc()}"
    print(STARTUP_ERROR)
    
    # Mock function so app doesn't crash on definition
    def get_supabase():
        return None



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
# Vercel filesystem is read-only except for /tmp
CACHE_DIR = "/tmp/cache"
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

@app.get("/api/health")
def health_check():
    # If there was an error during startup/imports, return it here so we can see it in production
    if STARTUP_ERROR:
        return {
            "status": "error", 
            "message": "Startup failed", 
            "detail": STARTUP_ERROR,
            "timestamp": str(datetime.now())
        }
    return {"status": "ok", "service": "backend", "timestamp": str(datetime.now())}

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
    supabase_client = get_supabase()
    try:
        # Optimization: Fetch all nav items in one query instead of two
        nav_res = supabase_client.table("navigation").select("*").order("sort_order").execute()
        
        # Site settings - REMOVED (Table deleted)
        is_debug = False
            
        all_items = nav_res.data if nav_res.data else []
        
        # Map snake_case (DB) to camelCase (Frontend)
        # and filter by side
        left_items = []
        right_items = []
        
        for item in all_items:
            # Create cleaner dict
            label = item.get("label")
            clean_item = {
                "label": label,
                "href": item.get("href"),
                "iconName": item.get("icon_name") or item.get("iconName") or "FileText", # Handle both
                "side": item.get("side")
            }
            
            if item.get("side") == "left":
                left_items.append(clean_item)
            elif item.get("side") == "right":
                right_items.append(clean_item)

        # FAIL SAFE: If DB is empty keys or error in filtering, return defaults
        # This is CRITICAL because if the API returns empty, the UI is broken.
        if not left_items and not right_items:
             print("Warning: Database returned empty navigation. Using defaults.")
             raise Exception("Empty Navigation")
            
        return {
            "leftNavItems": left_items,
            "rightNavItems": right_items,
            "isDebugMode": is_debug
        }
    except Exception as e:
        print(f"Error loading navigation: {e}")
        # FAIL SAFE: Return defaults if DB crashes so the site still works
        return {
            "leftNavItems": [
                {"label": "ARTICLES", "iconName": "FileText", "href": "/articles", "side": "left", "sort_order": 0},
                {"label": "RECIPES", "iconName": "Utensils", "href": "/recipes", "side": "left", "sort_order": 1},
                {"label": "GALLERY", "iconName": "Camera", "href": "/gallery", "side": "left", "sort_order": 2}
            ],
            "rightNavItems": [
                {"label": "POEMS", "iconName": "Feather", "href": "/poems", "side": "right", "sort_order": 0},
                {"label": "STORIES", "iconName": "BookOpen", "href": "/stories", "side": "right", "sort_order": 1},
                {"label": "ABOUT", "iconName": "User", "href": "/about", "side": "right", "sort_order": 2}
            ],
            "isDebugMode": False
        }


@app.api_route("/api/seed-defaults", methods=["GET", "POST"])
def seed_defaults():
    """
    One-time helper to populate the DB if it's empty.
    Callable via GET (browser) or POST.
    """
    supabase_client = get_supabase()
    try:
        # Check if empty
        existing = supabase_client.table("navigation").select("*").execute()
        if existing.data and len(existing.data) > 0:
            return {"status": "skipped", "message": "Database already has navigation items."}

        # Defaults
        defaults = [
            {"label": "ARTICLES", "iconName": "FileText", "href": "/articles", "side": "left", "sort_order": 0},
            {"label": "RECIPES", "iconName": "Utensils", "href": "/recipes", "side": "left", "sort_order": 1},
            {"label": "GALLERY", "iconName": "Camera", "href": "/gallery", "side": "left", "sort_order": 2},
            {"label": "POEMS", "iconName": "Feather", "href": "/poems", "side": "right", "sort_order": 0},
            {"label": "STORIES", "iconName": "BookOpen", "href": "/stories", "side": "right", "sort_order": 1},
            {"label": "ABOUT", "iconName": "User", "href": "/about", "side": "right", "sort_order": 2}
        ]

        # Insert
        # Note: mapping keys to match DB expectation is handled by Supabase client usually if keys match columns
        # We need to map camelCase (if any) to snake_case if your DB uses snake_case. 
        # Looking at previous code, 'icon_name' seemed to be the column name in update_navigation?
        # Let's check update_navigation usage: "icon_name": item.iconName
        
        db_rows = []
        for d in defaults:
            db_rows.append({
                "label": d["label"],
                "icon_name": d["iconName"], # Mapped to snake_case column
                "href": d["href"],
                "side": d["side"],
                "sort_order": d["sort_order"]
            })

        supabase_client.table("navigation").insert(db_rows).execute()
        return {"status": "success", "message": "Database populated with defaults."}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/navigation")
def update_navigation(data: NavigationData):
    supabase_client = get_supabase()
    try:
        # Debug Mode sync removed as site_settings table is deleted.
        # Frontend state is sufficient for current session.
        # supabase_client.table("site_settings").upsert({"key": "isDebugMode", "value": data.isDebugMode}).execute()
        pass
        
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

@app.get("/api/admin/fix-nav")
def fix_navigation_structure():
    """
    Force resets the navigation to the correct structure:
    Left: ARTICLES, RECIPES, GALLERY
    Right: POEMS, STORIES, ABOUT
    """
    supabase_client = get_supabase()
    try:
        # 1. Clear existing
        supabase_client.table("navigation").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        # 2. Define Correct Defaults
        rows = [
            # LEFT
            {"label": "ARTICLES", "icon_name": "FileText", "href": "/articles", "side": "left", "sort_order": 0},
            {"label": "RECIPES", "icon_name": "Utensils", "href": "/recipes", "side": "left", "sort_order": 1},
            {"label": "GALLERY", "icon_name": "Camera", "href": "/gallery", "side": "left", "sort_order": 2},
            
            # RIGHT
            {"label": "POEMS", "icon_name": "Feather", "href": "/poems", "side": "right", "sort_order": 0},
            {"label": "STORIES", "icon_name": "BookOpen", "href": "/stories", "side": "right", "sort_order": 1},
            {"label": "ABOUT", "icon_name": "User", "href": "/about", "side": "right", "sort_order": 2},
        ]
        
        # 3. Insert
        supabase_client.table("navigation").insert(rows).execute()
        
        return {"status": "success", "message": "Navigation reset to standard configuration."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Owner Verification ---
class VerifyOwnerRequest(BaseModel):
    id: str # User UUID
    email: Optional[str] = None # Backwards compatibility/logging

@app.api_route("/api/verify-owner", methods=["GET", "POST"])
async def verify_owner(request: Request):
    if request.method == "GET":
        return {"status": "ready", "message": "Verify Owner Endpoint is Accessible"}

    # Parse body for POST
    try:
        body = await request.json()
        req = VerifyOwnerRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bad Request: {e}")

    supabase_client = get_supabase()
    try:
        if req.email:
            normalized_email = req.email.lower().strip()
            # 1. Hardcoded Allowlist (Bootstrapping / Super Admin)
            ADMIN_EMAILS = ["home.bobbyyu@gmail.com"]
            if normalized_email in [e.lower() for e in ADMIN_EMAILS]:
                return {"isOwner": True}

        # 2. Database Role (Future Scalability)
        if not supabase_client:
            return {"isOwner": False, "error": "Database not connected"}

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
    supabase_client = get_supabase()
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
            # HYBRID SHUFFLE: Try to load seed from DB, fallback to Daily Date
            try:
                seed_res = supabase_client.table("site_settings").select("value").eq("key", "shuffleSeed").execute()
                if seed_res.data and len(seed_res.data) > 0:
                     random.seed(int(seed_res.data[0]["value"]))
                else:
                     # No seed in DB, use Daily Date
                     random.seed(int(datetime.now().strftime("%Y%m%d")))
            except Exception:
                # Table missing or error? Default to Daily Date
                random.seed(int(datetime.now().strftime("%Y%m%d")))

            count = min(len(all_photos), 3)
            highlights = random.sample(all_photos, count)
            random.seed() # Reset global rng

        return {"highlights": highlights, "albums": final_albums}
    except Exception as e:
        print(f"Gallery Error: {e}")
        return {"highlights": [], "albums": []}

class AlbumModel(BaseModel):
    title: str
    coverUrl: Optional[str] = ""
    date: Optional[str] = ""

@app.post("/api/gallery/albums")
def create_album(album: AlbumModel):
    supabase_client = get_supabase()
    try:
        new_id = str(uuid.uuid4())
        # Default cover if empty
        cover = album.coverUrl if album.coverUrl else "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
        
        # Use provided date or default to now
        date_label = album.date if album.date else datetime.now().strftime("%B %Y")

        data = {
            "id": new_id,
            "title": album.title,
            "cover_url": cover,
            "date_label": date_label
        }
        res = supabase_client.table("albums").insert(data).execute()
        return {"status": "success", "album": res.data[0] if res.data else data}
    except Exception as e:
        print(f"Create Album Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/gallery/albums/{album_id}")
def update_album(album_id: str, album: AlbumModel):
    supabase_client = get_supabase()
    try:
        data = {
            "title": album.title,
            "cover_url": album.coverUrl,
            "date_label": album.date
        }
        supabase_client.table("albums").update(data).eq("id", album_id).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Update Album Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/gallery/albums/{album_id}")
def delete_album(album_id: str):
    supabase_client = get_supabase()
    try:
        # Cascade delete should rely on DB relations, but let's be explicit if needed.
        # Assuming DB is set to cascade delete photos on album delete.
        supabase_client.table("albums").delete().eq("id", album_id).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Delete Album Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class PhotoModel(BaseModel):
    url: str
    type: str = "image"

@app.post("/api/gallery/albums/{album_id}/photos")
def add_photo(album_id: str, photo: PhotoModel):
    supabase_client = get_supabase()
    try:
        new_id = str(uuid.uuid4())
        data = {
            "id": new_id,
            "album_id": album_id,
            "url": photo.url,
            "type": photo.type
        }
        res = supabase_client.table("photos").insert(data).execute()
        return {"status": "success", "photo": res.data[0] if res.data else data}
    except Exception as e:
        print(f"Add Photo Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/gallery/albums/{album_id}/photos/{photo_id}")
def delete_photo(album_id: str, photo_id: str):
    supabase_client = get_supabase()
    try:
        supabase_client.table("photos").delete().eq("id", photo_id).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Delete Photo Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/gallery/highlights/shuffle")
def shuffle_highlights():
    supabase_client = get_supabase()
    try:
        new_seed = random.randint(1, 1000000)
        # Try to upsert. If table is missing, this will fail.
        supabase_client.table("site_settings").upsert({"key": "shuffleSeed", "value": new_seed}).execute()
        return {"status": "success", "seed": new_seed}
    except Exception as e:
        print(f"Shuffle Error: {e}")
        return {"status": "error", "message": str(e)}

# --- Proxy ---
@app.get("/api/proxy")
async def proxy_image(url: str, request: Request):
    # Simple redirect proxy for now to save bandwidth/complexity on Vercel
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")
    return RedirectResponse(url=url)

# --- Feedback ---
@app.post("/api/feedback")
async def submit_feedback(request: Request):
    """
    Receives feedback with optional file attachment.
    Expects Multipart Form Data if file is included, or JSON if just text.
    For simplicity, we'll try to parse as form data first.
    """
    try:
        # Check content type
        content_type = request.headers.get("content-type", "")
        
        message = ""
        contact = ""
        filename = ""
        file_size = 0
        
        if "multipart/form-data" in content_type:
            form = await request.form()
            message = form.get("message", "")
            contact = form.get("contact", "")
            upload = form.get("file")
            
            if upload and hasattr(upload, "filename") and upload.filename:
                filename = upload.filename
                # Read file content to get size (and effectively "upload" it)
                # In a real app we would upload the bytes to Supabase Storage S3
                contents = await upload.read()
                file_size = len(contents)
                # For local dev we could save it, but for Vercel we just log the receipt
                print(f"[Feedback] Received file: {filename} ({file_size} bytes)")
        
        else:
            # JSON Fallback
            data = await request.json()
            message = data.get("message", "")
            contact = data.get("contact", "")
            
        # Log to Console / Stdout for Vercel Logs
        log_entry = {
             "timestamp": str(datetime.now()),
             "message": message,
             "contact": contact,
             "attachment": filename,
             "size": file_size
        }
        print(f"[FEEDBACK] {json.dumps(log_entry)}")
        
        # Append to local log file if possible (Local Dev)
        try:
            log_path = os.path.join(BASE_DIR, "feedback_log.json")
            existing_logs = []
            if os.path.exists(log_path):
                try:
                    with open(log_path, "r") as f:
                        content = f.read()
                        if content:
                             existing_logs = json.loads(content)
                except:
                    pass
            
            existing_logs.append(log_entry)
            
            with open(log_path, "w") as f:
                json.dump(existing_logs, f, indent=2)
        except Exception as e:
            print(f"Could not write to local log file: {e}")

        return {"status": "success", "message": "Feedback received"}
        
    except Exception as e:
        print(f"Feedback Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
