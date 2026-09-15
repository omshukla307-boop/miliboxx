from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.blockchain_service import (
    blockchain_status,
    record_event as blockchain_record_event,
    get_container_events,
)


router = APIRouter(
    prefix="/blockchain",
    tags=["Blockchain"]
)


@router.get("/status")
def get_blockchain_status():

    try:
        return blockchain_status()

    except Exception as e:

        raise HTTPException(
            status_code=503,
            detail=f"Blockchain connection error: {str(e)}"
        )


class BlockchainEvent(BaseModel):

    container_id: str
    event_type: int
    latitude: int
    longitude: int
    details: str


@router.post("/record-event")
def record_event(event: BlockchainEvent):

    try:

        result = blockchain_record_event(
            container_id=event.container_id,
            event_type=event.event_type,
            latitude=event.latitude,
            longitude=event.longitude,
            details=event.details,
        )

        return {
            "message": "Blockchain event recorded successfully",
            "data": result,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to record blockchain event: {str(e)}"
        )


@router.get("/events/{container_id}")
def get_blockchain_events(container_id: str):

    try:

        events = get_container_events(
            container_id
        )

        return {
            "container_id": container_id,
            "events": events,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to read blockchain events: {str(e)}"
        )
