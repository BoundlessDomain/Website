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
                {"label": "PHOTOS", "iconName": "Camera", "href": "/photos"},
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
SUPABASE_STORAGE_URL = "https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/photos/"

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
            
            all_photos.append({
                "id": photo["id"],
                "type": "image",
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
                "url": req.url
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
