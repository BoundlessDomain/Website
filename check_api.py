import urllib.request
import json

urls = [
    "https://bobbyyu.me/api/health",
    "https://bobbyyu.me/api/gallery",
    "https://bobbyyu.me/api/gallery/"
]

for u in urls:
    print(f"Checking {u}...")
    try:
        with urllib.request.urlopen(u) as url:
            print(f"Status: {url.getcode()}")
            print(url.read().decode()[:100])
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)
