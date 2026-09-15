from fastapi import APIRouter, HTTPException

from app.database.supabase_client import supabase


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


# ==========================================
# GET ALL ALERTS
# ==========================================

@router.get("/")
def get_alerts():

    try:
        response = (
            supabase
            .table("alerts")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "alerts": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# SHOCK EVENTS
# ==========================================

@router.get("/shock-events")
def get_shock_events():
    try:
        response = (
            supabase
            .table("alerts")
            .select("*")
            .in_("alert_type", ["SHOCK_DETECTED", "VIBRATION_TAMPER", "VIBRATION"])
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# TAMPER EVENTS
# ==========================================

@router.get("/tamper-events")
def get_tamper_events():
    try:
        response = (
            supabase
            .table("alerts")
            .select("*")
            .in_("alert_type", ["UNAUTHORIZED_LID_OPENING", "DOOR_OPEN", "MOTION_DETECTED"])
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# GET ONE ALERT
# ==========================================

@router.get("/{alert_id}")
def get_alert(alert_id: int):

    try:
        response = (
            supabase
            .table("alerts")
            .select("*")
            .eq("id", alert_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        return {
            "success": True,
            "alert": response.data
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )


# ==========================================
# RESOLVE ALERT
# ==========================================

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: int):

    try:

        response = (
            supabase
            .table("alerts")
            .update({
                "resolved": True
            })
            .eq("id", alert_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        return {
            "success": True,
            "message": "Alert resolved successfully",
            "alert": response.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )