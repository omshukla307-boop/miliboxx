from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.database.supabase_client import supabase
from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/devices",
    tags=["Devices"]
)


# =========================
# REQUEST MODELS
# =========================

class DeviceCreate(BaseModel):
    device_id: str
    name: str
    status: str = "active"
    location_label: str


class DeviceUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    location_label: str | None = None


# =========================
# CREATE DEVICE
# =========================

@router.post("/")
def create_device(
    device: DeviceCreate,
    current_user=Depends(get_current_user)
):

    try:
        response = (
            supabase
            .table("devices")
            .insert({
                "device_id": device.device_id,
                "name": device.name,
                "status": device.status,
                "location_label": device.location_label
            })
            .execute()
        )

        return {
            "message": "Device created successfully",
            "device": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# =========================
# GET ALL DEVICES
# =========================

@router.get("/")
def get_devices(
    current_user=Depends(get_current_user)
):

    try:
        response = (
            supabase
            .table("devices")
            .select("*")
            .execute()
        )

        return {
            "devices": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================
# GET ONE DEVICE
# =========================

@router.get("/{device_id}")
def get_device(
    device_id: str,
    current_user=Depends(get_current_user)
):

    try:
        response = (
            supabase
            .table("devices")
            .select("*")
            .eq("device_id", device_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Device not found"
            )

        return {
            "device": response.data
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )


# =========================
# UPDATE DEVICE
# =========================

@router.patch("/{device_id}")
def update_device(
    device_id: str,
    device: DeviceUpdate,
    current_user=Depends(get_current_user)
):

    try:

        update_data = device.model_dump(
            exclude_none=True
        )

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update"
            )

        response = (
            supabase
            .table("devices")
            .update(update_data)
            .eq("device_id", device_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Device not found"
            )

        return {
            "message": "Device updated successfully",
            "device": response.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# =========================
# DELETE DEVICE
# =========================

@router.delete("/{device_id}")
def delete_device(
    device_id: str,
    current_user=Depends(get_current_user)
):

    try:

        response = (
            supabase
            .table("devices")
            .delete()
            .eq("device_id", device_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Device not found"
            )

        return {
            "message": "Device deleted successfully",
            "device": response.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )