import os
import sys

# Add the current directory to sys.path so we can import from python_backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from python_backend.index import app
