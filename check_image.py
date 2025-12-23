import urllib.request

url = "https://jywsejauxoxnwndocyee.supabase.co/storage/v1/object/public/gallery/Test_Album/1765931282048_5u997.jpg"

try:
    with urllib.request.urlopen(url) as response:
        print(f"Status: {response.getcode()}")
        print("Image exists!")
except Exception as e:
    print(f"Error accessing image: {e}")
