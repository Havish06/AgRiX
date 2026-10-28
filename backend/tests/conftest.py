# AgRiX test configuration
import sys
import os

# Add the project root (backend/) to Python path so `from app.main import app` works
_project_root = os.path.dirname(os.path.dirname(__file__))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)