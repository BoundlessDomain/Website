import sys
import os

# Mock Vercel environment path
sys.path.append(os.getcwd())

try:
    from api import index
    print("Import successful!")
    print(f"App: {index.app}")
except ImportError as e:
    print(f"Import failed: {e}")
except Exception as e:
    print(f"Error: {e}")
