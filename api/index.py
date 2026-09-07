import sys
import os
import traceback
import json

real_app = None
init_error = None

# Add search paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [current_dir, backend_dir, root_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app as _app
    real_app = _app
except Exception:
    init_error = traceback.format_exc()

async def app(scope, receive, send):
    global real_app, init_error
    if scope["type"] == "http":
        if real_app is not None:
            await real_app(scope, receive, send)
            return

        body = json.dumps({
            "status": "FATAL_INIT_ERROR",
            "error": init_error,
            "python_version": sys.version,
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "api_files": os.listdir(current_dir) if os.path.exists(current_dir) else [],
            "root_files": os.listdir(root_dir) if os.path.exists(root_dir) else []
        }, indent=2).encode("utf-8")

        await send({
            "type": "http.response.start",
            "status": 500,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode("ascii")),
            ]
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })
    elif scope["type"] == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await send({"type": "lifespan.shutdown.complete"})
                break
