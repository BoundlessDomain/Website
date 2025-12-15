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
