import hashlib

from fastapi import Header, HTTPException

from app.database.supabase_client import supabase


def verify_device_key(
    x_device_key: str | None = Header(default=None)
):
    # ==========================================
    # 1. DEVICE KEY CHECK
    # ==========================================

    if not x_device_key:
        raise HTTPException(
            status_code=401,
            detail="Device key missing"
        )


    # ==========================================
    # 2. HASH DEVICE KEY
    # ==========================================

    key_hash = hashlib.sha256(
        x_device_key.encode()
    ).hexdigest()


    # ==========================================
    # 3. FIND DEVICE
    # ==========================================

    try:

        response = (
            supabase
            .table("devices")
            .select("device_id, status")
            .eq("device_key_hash", key_hash)
            .single()
            .execute()
        )


        # ==========================================
        # 4. INVALID DEVICE KEY
        # ==========================================

        if not response.data:

            raise HTTPException(
                status_code=401,
                detail="Invalid device key"
            )


        # ==========================================
        # 5. CHECK DEVICE STATUS
        # ==========================================

        device_status = response.data["status"]

        # Both active and online devices are allowed
        if device_status not in ("active", "online"):

            raise HTTPException(
                status_code=403,
                detail="Device is not active"
            )


        # ==========================================
        # 6. RETURN DEVICE
        # ==========================================

        return response.data


    except HTTPException:
        raise


    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid device key"
        )