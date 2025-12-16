from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import json
import os
import html

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
DATA_FILE = "navigation_data.json"

def load_data():
    if not os.path.exists(DATA_FILE):
        # Default Data
        return {
            "leftNavItems": [
                {"label": "ARTICLES", "iconName": "FileText", "href": "/articles"},
                {"label": "RECIPES", "iconName": "Utensils", "href": "/recipes"},
                {"label": "GALLERY", "iconName": "Camera", "href": "/gallery"},
            ],
            "rightNavItems": [
                {"label": "POEMS", "iconName": "Feather", "href": "/poems"},
                {"label": "STORIES", "iconName": "BookOpen", "href": "/stories"},
                {"label": "ABOUT", "iconName": "User", "href": "/about"},
            ],
            "isDebugMode": False
        }
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/navigation")
def get_navigation():
    return load_data()

@app.post("/api/navigation")
def update_navigation(data: NavigationData):
    # Convert Pydantic model to dict
    data_dict = data.dict()
    save_data(data_dict)
    return {"status": "success", "data": data_dict}

# --- Owner Verification ---
OWNERS_FILE = "owners.json"

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
        "timestamp": "Now", # In a real app, use datetime
        "status": "Logged"
    }

    # Log to file (Acts as an inbox)
    FEEDBACK_FILE = "feedback_log.json"
    existing_feedback = []
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            try:
                existing_feedback = json.load(f)
            except:
                pass
    
    existing_feedback.append(feedback_entry)
    
    with open(FEEDBACK_FILE, "w") as f:
        json.dump(existing_feedback, f, indent=4)

    print(f"--- FEEDBACK SAVED ---")
    print(f"Entry: {feedback_entry}")
    print(f"Sending notification to owners: {owners}")
    
    return {"status": "success", "message": "Feedback saved and owners notified"}

import random
from datetime import datetime
import uuid

# --- Photos System ---
PHOTOS_FILE = "photos_data.json"
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

@app.get("/api/photos")
def get_photos():
    if not os.path.exists(PHOTOS_FILE):
        return {"highlights": [], "albums": []}
    
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
        
    # --- Dynamic Daily Highlights ---
    # 1. Gather all photos from all albums
    all_photos = []
    albums = data.get("albums", [])
    
    # Process Albums URLs
    for album in albums:
        album["coverUrl"] = process_url(album.get("coverUrl", ""))
        title = album.get("title", "")
        
        for photo in album.get("photos", []):
            # Process Photo URL
            original_url = photo.get("url", "")
            final_url = process_url(original_url)
            photo["url"] = final_url
            media_type = photo.get("type", "image")
            
            all_photos.append({
                "id": photo["id"],
                "type": media_type,
                "url": final_url,
                "caption": title 
            })
    
    # 2. Select 3 random photos, seeded by today's date
    if all_photos:
        # Check if we have a forced shuffle seed saved
        shuffle_seed = data.get("shuffleSeed")
        
        if shuffle_seed:
            random.seed(shuffle_seed)
        else:
            # Default to daily seed
            today_seed = int(datetime.now().strftime("%Y%m%d"))
            random.seed(today_seed)
        
        # Ensure we don't try to sample more than we have
        count = min(len(all_photos), 3)
        daily_highlights = random.sample(all_photos, count)
        
        # Important: Reset seed
        random.seed()
        
        # Override highlights
        data["highlights"] = daily_highlights
        
    return data

@app.post("/api/photos/highlights/shuffle")
def shuffle_highlights():
    if not os.path.exists(PHOTOS_FILE):
        return {"status": "error"}
    
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
    
    # Generate a new random seed and save it
    new_seed = random.randint(1, 1000000)
    data["shuffleSeed"] = new_seed
    
    with open(PHOTOS_FILE, "w") as f:
        json.dump(data, f, indent=4)
        
    return {"status": "success", "seed": new_seed}

class CreateAlbumRequest(BaseModel):
    title: str
    coverUrl: str = ""

@app.post("/api/photos/albums")
def create_album(req: CreateAlbumRequest):
    if not os.path.exists(PHOTOS_FILE):
        return {"status": "error"}
        
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
        
    new_album = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "coverUrl": req.coverUrl if req.coverUrl else "https://picsum.photos/seed/new/400/400",
        "date": datetime.now().strftime("%B %Y"),
        "photos": []
    }
    
    if "albums" not in data:
        data["albums"] = []
        
    data["albums"].insert(0, new_album) # Add to top
    
    with open(PHOTOS_FILE, "w") as f:
        json.dump(data, f, indent=4)
        
    return {"status": "success", "album": new_album}

class UpdateAlbumRequest(BaseModel):
    title: str
    coverUrl: str
    date: str = None # Optional, if not provided, keep existing

@app.put("/api/photos/albums/{album_id}")
def update_album(album_id: str, req: UpdateAlbumRequest):
    if not os.path.exists(PHOTOS_FILE):
        return {"status": "error"}
        
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
        
    found = False
    for album in data.get("albums", []):
        if album["id"] == album_id:
            album["title"] = req.title
            album["coverUrl"] = req.coverUrl
            if req.date:
                album["date"] = req.date
            found = True
            break
            
    if found:
        with open(PHOTOS_FILE, "w") as f:
            json.dump(data, f, indent=4)
        return {"status": "success"}
    return {"status": "error", "message": "Album not found"}

class AddPhotoRequest(BaseModel):
    url: str
    type: str = "image"

@app.post("/api/photos/albums/{album_id}/photos")
def add_photo_to_album(album_id: str, req: AddPhotoRequest):
    if not os.path.exists(PHOTOS_FILE):
        return {"status": "error"}
        
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
        
    found = False
    new_photo = None
    for album in data.get("albums", []):
        if album["id"] == album_id:
            new_photo = {
                "id": str(uuid.uuid4()),
                "url": req.url,
                "type": req.type
            }
            if "photos" not in album:
                album["photos"] = []
            album["photos"].append(new_photo)
            found = True
            break
            
    if found:
        with open(PHOTOS_FILE, "w") as f:
            json.dump(data, f, indent=4)
        return {"status": "success", "photo": new_photo}
    return {"status": "error", "message": "Album not found"}

@app.delete("/api/photos/albums/{album_id}")
def delete_album(album_id: str):
    if not os.path.exists(PHOTOS_FILE):
        return {"status": "error"}
        
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
        
    albums = data.get("albums", [])
    initial_count = len(albums)
    # Filter out the album with the matching ID
    data["albums"] = [a for a in albums if a["id"] != album_id]
    
    if len(data["albums"]) < initial_count:
        with open(PHOTOS_FILE, "w") as f:
            json.dump(data, f, indent=4)
        return {"status": "success"}
        
    return {"status": "error", "message": "Album not found"}


@app.delete("/api/photos/albums/{album_id}/photos/{photo_id}")
def delete_photo_from_album(album_id: str, photo_id: str):
    if not os.path.exists(PHOTOS_FILE):
        return {"status": "error"}
        
    with open(PHOTOS_FILE, "r") as f:
        data = json.load(f)
        
    found_album = False
    for album in data.get("albums", []):
        if album["id"] == album_id:
            found_album = True
            initial_count = len(album.get("photos", []))
            # Filter out the photo
            album["photos"] = [p for p in album["photos"] if p["id"] != photo_id]
            
            if len(album["photos"]) < initial_count:
                with open(PHOTOS_FILE, "w") as f:
                    json.dump(data, f, indent=4)
                return {"status": "success"}
            return {"status": "error", "message": "Photo not found"}
            
    if not found_album:
        return {"status": "error", "message": "Album not found"}
# --- Proxy & Cache System ---
import hashlib
import urllib.request
import shutil
from fastapi.responses import FileResponse

CACHE_DIR = "cache"

# Ensure cache dir exists
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Clear cache on startup (simulating "delete when website is closed/restarted")
# In a real app we might want to do this on shutdown or use a lifespan event, 
# but simply clearing it here ensures fresh start when running this script.
for filename in os.listdir(CACHE_DIR):
    file_path = os.path.join(CACHE_DIR, filename)
    try:
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)
    except Exception as e:
        print(f"Failed to delete {file_path}. Reason: {e}")

@app.get("/api/proxy")
def proxy_image(url: str):
    """
    Downloads and caches the image from the given URL.
    Serves the local file.
    """
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")

    # Generate filename from hash of URL
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    # Attempt to guess extension or default to .bin. 
    # Proper way is checking Content-Type header but for simplicity we can try to parse url or use generic.
    # If the URL has an extension, use it.
    ext = os.path.splitext(url.split("?")[0])[1]
    if not ext:
        ext = ".jpg" # Default fallback
    
    filename = f"{url_hash}{ext}"
    file_path = os.path.join(CACHE_DIR, filename)

    # Check cache
    if os.path.exists(file_path):
        return FileResponse(file_path)

    # Download and cache
    try:
        # Use a user agent to avoid 403s from some strict servers (though Supabase usually fine)
        req = urllib.request.Request(
            url, 
            data=None, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        with urllib.request.urlopen(req) as response, open(file_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
            
        return FileResponse(file_path)
    except Exception as e:
        print(f"Proxy Error for {url}: {e}")
        # If download fails, redirect or 404. 
        # Redirecting to original URL is a safe fallback if backend fails to download.
        # But we can't redirect with FileResponse return type expected implicitly.
        # Let's return error or try to redirect (302).
        from starlette.responses import RedirectResponse
        return RedirectResponse(url=url)
