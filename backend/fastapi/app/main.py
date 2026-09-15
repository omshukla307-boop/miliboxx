from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.routes import box, auth, devices, alerts, telemetry,images,blockchain
from app.websocket_manager import add_client, remove_client


app = FastAPI(
    title="Military Box Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://milibox.vercel.app",
        "https://miliboxx.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# API ROUTES
# =========================
app.include_router(box.router)
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(alerts.router)
app.include_router(telemetry.router)
app.include_router(images.router)
app.include_router(blockchain.router)

# Aliases for /api/* frontend endpoints
app.include_router(alerts.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")
# =========================
# WEBSOCKET
# =========================

@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):

    await websocket.accept()

    # Add connected client
    await add_client(websocket)

    # Send connection confirmation
    await websocket.send_json({
        "message": "WebSocket connected",
        "status": "connected"
    })

    try:

        while True:

            data = await websocket.receive_text()

            await websocket.send_text(
                f"Server received: {data}"
            )

    except Exception:

        # Remove disconnected client
        remove_client(websocket)


# =========================
# ROOT
# =========================

@app.get("/")
def root():

    return {
        "project": "Military Box",
        "backend": "FastAPI",
        "status": "running"
    }