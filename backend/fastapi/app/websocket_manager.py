from fastapi import WebSocket


connected_clients = []


async def add_client(websocket: WebSocket):

    connected_clients.append(websocket)


def remove_client(websocket: WebSocket):

    if websocket in connected_clients:
        connected_clients.remove(websocket)


async def send_alert_to_clients(alert_data):

    for websocket in connected_clients:

        await websocket.send_json(alert_data)