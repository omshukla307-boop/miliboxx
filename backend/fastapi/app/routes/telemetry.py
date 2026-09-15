from fastapi import APIRouter, HTTPException, Query, Depends

from app.database.supabase_client import supabase
from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"]
)


from datetime import datetime
from pydantic import BaseModel

class TelemetryInput(BaseModel):
    container_id: str | None = None
    device_id: str | None = None
    timestamp: str | None = None
    temperature: float | None = None
    humidity: float | None = None
    shock_g: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    lid_open: bool | None = None


# =========================
# RECORD TELEMETRY
# =========================

@router.post("")
@router.post("/")
def record_telemetry(payload: TelemetryInput):
    dev_id = payload.device_id or payload.container_id or "ESP32_MILITARY_BOX_01"
    now_iso = payload.timestamp or datetime.utcnow().isoformat()
    try:
        entry = {
            "device_id": dev_id,
            "temperature": payload.temperature,
            "humidity": payload.humidity,
            "vibration_detected": bool(payload.shock_g and payload.shock_g > 2.0),
            "door_open": bool(payload.lid_open),
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "timestamp": now_iso
        }
        entry = {k: v for k, v in entry.items() if v is not None}
        res = supabase.table("sensor_telemetry").insert(entry).execute()
        return {"status": "ok", "message": "Telemetry recorded", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# GET TELEMETRY HISTORY
# =========================

@router.get("/{device_id}")
def get_telemetry(
    device_id: str,
    limit: int = Query(default=50, ge=1, le=500),
    current_user=Depends(get_current_user)
):
    try:
        response = (
            supabase
            .table("sensor_telemetry")
            .select("*")
            .eq("device_id", device_id)
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )

        return {
            "device_id": device_id,
            "count": len(response.data),
            "telemetry": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================
# GET LATEST TELEMETRY
# =========================

@router.get("/{device_id}/latest")
def get_latest_telemetry(
    device_id: str,
    current_user=Depends(get_current_user)
):
    try:
        response = (
            supabase
            .table("sensor_telemetry")
            .select("*")
            .eq("device_id", device_id)
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="No telemetry data found"
            )

        return {
            "device_id": device_id,
            "telemetry": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )