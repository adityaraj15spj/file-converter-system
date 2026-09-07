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
except Exception as exc:
    import traceback
    _startup_err = traceback.format_exc()
    print(f"[FATAL STARTUP ERROR] {_startup_err}", file=sys.stderr)
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def diag_handler(request: Request, path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Serverless Function Startup Failure",
                "detail": str(exc),
                "traceback": _startup_err,
                "sys_path": sys.path,
                "api_dir_contents": os.listdir(api_dir) if os.path.exists(api_dir) else [],
                "root_dir_contents": os.listdir(root_dir) if os.path.exists(root_dir) else []
            }
        )
