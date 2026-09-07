import sys
import os

# Priority 1: Co-located in api directory
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

# Priority 2: Root and backend directories
root_dir = os.path.dirname(api_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, root_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except ImportError:
    try:
        from backend.app.main import app
    except ImportError:
        from api.app.main import app

