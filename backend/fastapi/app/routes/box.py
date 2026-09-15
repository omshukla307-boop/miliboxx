from fastapi import APIRouter, Depends
import logging

from app.models.box_data import BoxData
from app.database.supabase_client import supabase

from app.alerts.alert_rules import (
    check_temperature_alert,
    check_tamper_alert,
    check_shock_alert,
    check_motion_alert
)

from app.websocket_manager import send_alert_to_clients
from app.auth.device_auth import verify_device_key

from app.services.blockchain_service import record_event as blockchain_record_event


router = APIRouter(
    prefix="/api/v1",
    tags=["Military Box"]
)

logger = logging.getLogger(__name__)


# Blockchain event type mapping
BLOCKCHAIN_EVENT_TYPES = {
    "HIGH_TEMPERATURE": 0,
    "UNAUTHORIZED_LID_OPENING": 1,
    "SHOCK_DETECTED": 2,
    "MOTION_DETECTED": 3,
}


def scale_coordinate(value):
    if value is None:
        return 0

    return int(round(value * 1_000_000))


@router.post("/box-data")
async def receive_box_data(
    data: BoxData,
    device=Depends(verify_device_key)
):

    # ==========================================
    # 1. PREPARE SENSOR READING
    # ==========================================

    reading = {

        "device_id": data.device_id,

        # DHT22
        "temperature": data.temperature,
        "humidity": data.humidity,

        # DS18B20
        "probe_temperature": data.probe_temperature,

        # MPU6050
        "vibration_detected": data.shock,

        # LDR
        "door_open": data.tamper,

        # HC-SR501 PIR
        "motion_detected": data.motion,

        # Battery
        "battery_percentage": data.battery,

        # GPS
        "latitude": data.latitude,
        "longitude": data.longitude,

        # Future Camera
        "camera_triggered": data.camera_triggered,
        "image_id": data.image_id,
        "image_path": data.image_path,

        # Original ESP32 payload
        "raw_payload": {
            "device_id": data.device_id,
            "timestamp": data.timestamp.isoformat(),

            "temperature": data.temperature,
            "humidity": data.humidity,
            "probe_temperature": data.probe_temperature,

            "tamper": data.tamper,
            "shock": data.shock,
            "motion": data.motion,

            "battery": data.battery,

            "latitude": data.latitude,
            "longitude": data.longitude,

            "camera_triggered": data.camera_triggered,
            "image_id": data.image_id,
            "image_path": data.image_path
        },

        "timestamp": data.timestamp.isoformat()
    }


    # ==========================================
    # 2. STORE TELEMETRY IN SUPABASE
    # ==========================================

    supabase.table("sensor_telemetry").insert(
        reading
    ).execute()


    # ==========================================
    # 3. CHECK ALL ALERTS
    # ==========================================

    temperature_alert = check_temperature_alert(
        data.temperature
    )

    tamper_alert = check_tamper_alert(
        data.tamper
    )

    shock_alert = check_shock_alert(
        data.shock
    )

    motion_alert = check_motion_alert(
        data.motion
    )


    alerts = [
        temperature_alert,
        tamper_alert,
        shock_alert,
        motion_alert
    ]


    # ==========================================
    # 4. SAVE + SEND ACTIVE ALERTS
    # ==========================================

    for alert in alerts:

        if alert["alert"]:

            # ----------------------------------
            # Save alert to Supabase
            # ----------------------------------

            supabase.table("alerts").insert({
                "device_id": data.device_id,
                "alert_type": alert["type"],
                "severity": alert["severity"],
                "message": alert["message"]
            }).execute()


            # ----------------------------------
            # Prepare WebSocket alert
            # ----------------------------------

            alert_data = {

                "device_id": data.device_id,

                "alert": alert["alert"],

                "type": alert["type"],

                "severity": alert["severity"],

                "message": alert["message"],

                "temperature": data.temperature,

                "probe_temperature": data.probe_temperature,

                "tamper": data.tamper,

                "shock": data.shock,

                "motion": data.motion
            }


            # ----------------------------------
            # Send real-time alert
            # ----------------------------------

            await send_alert_to_clients(
                alert_data
            )


            # ==================================
            # 5. RECORD SECURITY EVENT ONCHAIN
            # ==================================

            blockchain_event_type = BLOCKCHAIN_EVENT_TYPES.get(
                alert["type"]
            )

            if blockchain_event_type is not None:

                try:

                    blockchain_result = blockchain_record_event(

                        container_id=data.device_id,

                        event_type=blockchain_event_type,

                        latitude=scale_coordinate(
                            data.latitude
                        ),

                        longitude=scale_coordinate(
                            data.longitude
                        ),

                        details=(
                            f'{alert["type"]}: '
                            f'{alert["message"]}'
                        )
                    )

                    logger.info(
                        "Blockchain event recorded: %s",
                        blockchain_result["transaction_hash"]
                    )

                except Exception as blockchain_error:

                    # Blockchain failure must not break
                    # the existing telemetry/alert flow.

                    logger.error(
                        "Blockchain event recording failed: %s",
                        blockchain_error
                    )


    # ==========================================
    # 6. RESPONSE
    # ==========================================

    return {

        "success": True,

        "message": "Military Box data stored",

        "device_id": data.device_id,

        "alerts": {

            "temperature": temperature_alert,

            "tamper": tamper_alert,

            "shock": shock_alert,

            "motion": motion_alert
        }
    }
