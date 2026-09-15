from fastapi import WebSocket, WebSocketDisconnect

from app.websocket_manager import add_client, remove_client


async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    await add_client(websocket)

    try:

        await websocket.send_json({
            "message": "WebSocket connected",
            "status": "connected"
        })

        while True:
            data = await websocket.receive_text()

            await websocket.send_text(
                f"Server received: {data}"
            )

    except WebSocketDisconnect:

        remove_client(websocket)

    except Exception:

        remove_client(websocket)