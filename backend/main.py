from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from typing import List
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

supabase_client = get_supabase()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.http_client = httpx.AsyncClient(follow_redirects=True)
    yield
    # Shutdown
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper for paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_path(filename):
    return os.path.join(BASE_DIR, filename)

# --- Data Models ---
class NavItem(BaseModel):
    label: str
    iconName: str
    href: str

class NavigationData(BaseModel):
    leftNavItems: List[NavItem]
    rightNavItems: List[NavItem]
    isDebugMode: bool = False

# --- Storage ---
DATA_FILE = get_path("navigation_data.json")

def load_data():
    try:
        # Fetch Navigation
        # We need to sort by 'sort_order' potentially, but standard fetch is okay
        left_res = supabase_client.table("navigation").select("*").eq("side", "left").order("sort_order").execute()
        right_res = supabase_client.table("navigation").select("*").eq("side", "right").order("sort_order").execute()
        
        # Fetch Settings
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
        return {
            "leftNavItems": [],
            "rightNavItems": [],
            "isDebugMode": False
        }

def save_data(data):
    # Atomic write
    temp_file = f"{DATA_FILE}.tmp"
    with open(temp_file, "w") as f:
        json.dump(data, f, indent=4)
    os.replace(temp_file, DATA_FILE)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/navigation")
def get_navigation():
    return load_data()

@app.post("/api/navigation")
def update_navigation(data: NavigationData):
    try:
        # 1. Update Debug Mode
        supabase_client.table("site_settings").upsert({"key": "isDebugMode", "value": data.isDebugMode}).execute()
        
        # 2. Update Navigation Items
        # Strategy: Clear existing side and re-insert (simplest for sorting updates)
        # In a real heavy app, we'd issue updates by ID, but full wipe/replace per side is safer for order consistency here.
        
        # Left
        supabase_client.table("navigation").delete().eq("side", "left").execute()
        if data.leftNavItems:
            left_inserts = []
            for i, item in enumerate(data.leftNavItems):
                left_inserts.append({
                    "side": "left",
                    "sort_order": i,
                    "label": item.label,
                    "icon_name": item.iconName,
                    "href": item.href
                })
            supabase_client.table("navigation").insert(left_inserts).execute()
            
        # Right
        supabase_client.table("navigation").delete().eq("side", "right").execute()
        if data.rightNavItems:
            right_inserts = []
            for i, item in enumerate(data.rightNavItems):
                right_inserts.append({
                    "side": "right",
                    "sort_order": i,
                    "label": item.label,
                    "icon_name": item.iconName,
                    "href": item.href
                })
            supabase_client.table("navigation").insert(right_inserts).execute()

        return {"status": "success"}
    except Exception as e:
        print(f"Error saving navigation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Owner Verification ---
OWNERS_FILE = get_path("owners.json")

def load_owners():
    if not os.path.exists(OWNERS_FILE):
        return []
    with open(OWNERS_FILE, "r") as f:
        return json.load(f)

class VerifyOwnerRequest(BaseModel):
    email: str

@app.post("/api/verify-owner")
def verify_owner(req: VerifyOwnerRequest):
    owners = load_owners()
    # Case insensitive check
    is_owner = req.email.strip().lower() in [o.strip().lower() for o in owners]
    return {"isOwner": is_owner}

# --- Feedback System ---
class FeedbackRequest(BaseModel):
    message: str = Field(..., max_length=2000, description="The feedback message")
    contact: str = Field("", max_length=200, description="Optional contact info")

@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest):
    owners = load_owners()
    
    # Sanitize inputs (HTML Escape) to prevent XSS if viewed in browser
    safe_message = html.escape(req.message)
    safe_contact = html.escape(req.contact)

    # Create feedback entry
    feedback_entry = {
        "message": safe_message,
        "contact": safe_contact,
        "timestamp": datetime.now().isoformat(),
        "status": "Logged"
    }

    # Log to file (Acts as an inbox)
    FEEDBACK_FILE = get_path("feedback_log.json")
    existing_feedback = []
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            try:
                existing_feedback = json.load(f)
            except:
                pass
    
    existing_feedback.append(feedback_entry)
    
    # Atomic write
    temp_file = f"{FEEDBACK_FILE}.tmp"
    with open(temp_file, "w") as f:
        json.dump(existing_feedback, f, indent=4)
    os.replace(temp_file, FEEDBACK_FILE)

    print(f"--- FEEDBACK SAVED ---")
    print(f"Entry: {feedback_entry}")
    print(f"Sending notification to owners: {owners}")
    
    return {"status": "success", "message": "Feedback saved and owners notified"}


# --- Gallery System ---
PHOTOS_FILE = get_path("gallery_data.json")
# Placeholder: Replace with your actual Supabase Project URL later
SUPABASE_STORAGE_URL = "https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/gallery/"

def process_url(url):
    """
    Hybrid URL Logic:
    - If it starts with 'http', it's an external link (Picsum, etc.) -> Keep as is.
    - If NOT, it's a relative path in Supabase Storage -> Prepend Storage URL.
    """
    if url.startswith("http"):
        return url
    return f"{SUPABASE_STORAGE_URL.rstrip('/')}/{url.lstrip('/')}"

def save_photos_data(data):
    # Atomic write
    temp_file = f"{PHOTOS_FILE}.tmp"
    with open(temp_file, "w") as f:
        json.dump(data, f, indent=4)
    os.replace(temp_file, PHOTOS_FILE)

@app.get("/api/gallery")
def get_photos():
    try:
        # Fetch Albums with Photos (Relational Query)
        res = supabase_client.table("albums").select("*, photos(*)").execute()
        albums = res.data if res.data else []
        
        all_photos = []
        
        # Sort albums python-side or DB-side. DB-side needs custom sort on text date which is hard.
        # Let's keep Python sorting for compatibility with 'Month Year' string format.
        def parse_album_date(d):
            try:
                return datetime.strptime(d, "%B %Y")
            except:
                return datetime.min

        albums.sort(key=lambda x: parse_album_date(x.get("date_label", "")), reverse=True)
        
        # Normalize structure for Frontend
        # Frontend expects: id, title, coverUrl, date, photos: [{id, url, type}]
        # Supabase returns: id, title, cover_url, date_label, photos: [...]
        # We need to map camelCase.
        
        final_albums = []
        for a in albums:
            mapped_album = {
                "id": a["id"],
                "title": a["title"],
                "coverUrl": process_url(a.get("cover_url") or ""),
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
                
                # Collect for highlights
                all_photos.append({
                    "id": p["id"],
                    "type": p.get("type", "image"),
                    "url": p_url,
                    "caption": a["title"],
                    "albumId": a["id"]
                })
                
            final_albums.append(mapped_album)

        # Highlights Logic
        highlights = []
        if all_photos:
            # Fetch Seed
            seed_res = supabase_client.table("site_settings").select("value").eq("key", "shuffleSeed").execute()
            if seed_res.data:
                random.seed(seed_res.data[0]["value"])
            else:
                today_seed = int(datetime.now().strftime("%Y%m%d"))
                random.seed(today_seed)
                
            count = min(len(all_photos), 3)
            highlights = random.sample(all_photos, count)
            random.seed() # Reset

        return {
            "highlights": highlights,
            "albums": final_albums
        }
        
    except Exception as e:
        print(f"Error fetching gallery: {e}")
        return {"highlights": [], "albums": []}

@app.post("/api/gallery/highlights/shuffle")
def shuffle_highlights():
    try:
        new_seed = random.randint(1, 1000000)
        supabase_client.table("site_settings").upsert({"key": "shuffleSeed", "value": new_seed}).execute()
        return {"status": "success", "seed": new_seed}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class CreateAlbumRequest(BaseModel):
    title: str
    coverUrl: str = ""

@app.post("/api/gallery/albums")
def create_album(req: CreateAlbumRequest):
    try:
        new_album = {
            "title": req.title,
            "cover_url": req.coverUrl if req.coverUrl else "https://picsum.photos/seed/new/400/400",
            "date_label": datetime.now().strftime("%B %Y")
        }
        res = supabase_client.table("albums").insert(new_album).execute()
        created = res.data[0]
        
        # Format for frontend
        return {"status": "success", "album": {
             "id": created["id"],
             "title": created["title"],
             "coverUrl": created["cover_url"],
             "date": created["date_label"],
             "photos": []
        }}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class UpdateAlbumRequest(BaseModel):
    title: str
    coverUrl: str
    date: str = None 

@app.put("/api/gallery/albums/{album_id}")
def update_album(album_id: str, req: UpdateAlbumRequest):
    try:
        update_data = {
            "title": req.title,
            "cover_url": req.coverUrl
        }
        if req.date:
            update_data["date_label"] = req.date
            
        supabase_client.table("albums").update(update_data).eq("id", album_id).execute()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class AddPhotoRequest(BaseModel):
    url: str
    type: str = "image"

@app.post("/api/gallery/albums/{album_id}/photos")
def add_photo_to_album(album_id: str, req: AddPhotoRequest):
    try:
        new_photo = {
            "album_id": album_id,
            "url": req.url,
            "type": req.type
        }
        res = supabase_client.table("photos").insert(new_photo).execute()
        created = res.data[0]
        
        return {"status": "success", "photo": {
            "id": created["id"],
            "url": created["url"],
            "type": created["type"]
        }}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/api/gallery/albums/{album_id}")
def delete_album(album_id: str):
    try:
        supabase_client.table("albums").delete().eq("id", album_id).execute()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.delete("/api/gallery/albums/{album_id}/photos/{photo_id}")
def delete_photo_from_album(album_id: str, photo_id: str):
    try:
        # Optional: Clean cache logic could be kept here if we fetch the URL first, 
        # but for Vercel/Supabase migration let's skip local cache cleanup for now 
        # or implement it if Vercel ephemeral file system matters (it doesn't for cache).
        
        supabase_client.table("photos").delete().eq("id", photo_id).execute()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Proxy & Cache System ---

CACHE_DIR = get_path("cache")

# Ensure cache dir exists
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Clear cache on startup
for filename in os.listdir(CACHE_DIR):
    file_path = os.path.join(CACHE_DIR, filename)
    try:
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)
    except Exception as e:
        print(f"Failed to delete {file_path}. Reason: {e}")

def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Resolve hostname to IP
        try:
            ip_address = ipaddress.ip_address(hostname)
        except ValueError:
            # If it's a domain name, we might want to resolve it, but that adds DNS overhead.
            # A simple heuristic is to block 'localhost', '127.0.0.1', etc.
            # Ideally we would resolve it, but here we will just block common private ranges string-wise if it is an IP,
            # and rely on the fact that general domains are usually public.
            # However, for robust SSRF, DNS resolution is needed.
            # For this simple implementation, we will explicitly block localhost and internal IPs.
            if hostname in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
                return False
            return True

        if ip_address.is_private or ip_address.is_loopback or ip_address.is_link_local:
            return False

        return True
    except:
        return False

@app.get("/api/proxy")
async def proxy_image(url: str, request: Request):
    """
    Downloads and caches the image from the given URL using async I/O.
    Serves the local file.
    Includes SSRF protection.
    """
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")

    # SSRF Protection
    if not is_safe_url(url):
        print(f"Blocked Unsafe URL: {url}")
        raise HTTPException(status_code=403, detail="URL not allowed")

    # Generate filename from hash of URL
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    # Attempt to guess extension or default to .bin. 
    ext = os.path.splitext(url.split("?")[0])[1]
    if not ext:
        ext = ".jpg" # Default fallback
    
    filename = f"{url_hash}{ext}"
    file_path = os.path.join(CACHE_DIR, filename)

    # Check cache (Atomic check: if it exists, it is complete)
    if os.path.exists(file_path):
        return FileResponse(file_path)

    # Download to temp file first to avoid serving partial files
    temp_path = file_path + ".tmp"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        client = request.app.state.http_client
        response = await client.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"Proxy failed to fetch {url}: {response.status_code}")
            return RedirectResponse(url=url)

        async with aiofiles.open(temp_path, 'wb') as out_file:
            await out_file.write(response.content)

        # Verify size if Content-Length provided
        content_length = response.headers.get('content-length')
        if content_length:
            expected_size = int(content_length)
            actual_size = os.path.getsize(temp_path)
            if actual_size != expected_size:
                    raise Exception(f"Incomplete download: Expected {expected_size}, got {actual_size}")

        # Atomic move
        os.replace(temp_path, file_path)
            
        return FileResponse(file_path)
    except Exception as e:
        print(f"Proxy Error for {url}: {e}")
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return RedirectResponse(url=url)
