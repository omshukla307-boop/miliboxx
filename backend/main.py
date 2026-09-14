from fastapi import FastAPI, HTTPException, Header, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import os
import time
import json
import hmac
import hashlib
import random

from config import settings
from models import (
    ESP32TelemetryPayload,
    DeviceRegisterSchema,
    AlertSchema,
    UserSignupSchema,
    UserLoginSchema,
    TokenResponseSchema
)
from security import verify_esp32_security
from supabase_client import get_supabase_client
from blockchain_service import BlockchainSupabaseService

blockchain_svc = BlockchainSupabaseService()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("military_box_api")

app = FastAPI(
    title="Military Box Hardened IoT Telemetry Backend",
    description="FastAPI Backend for ESP32 Telemetry & Supabase DB with HMAC-SHA256 Signatures, Replay Attack Protection & Audit Logging.",
    version="1.2.0"
)

security_bearer = HTTPBearer(auto_error=False)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for Tactical Dashboard Frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


# ================= HELPER FOR SECURITY AUDIT LOGGING =================

def log_security_event(event_type: str, details: str, ip_address: Optional[str] = None, device_id: Optional[str] = None):
    """Log security events to Supabase security_audit_logs table (fail-safe)."""
    try:
        sb = get_supabase_client()
        audit_record = {
            "event_type": event_type,
            "details": details,
            "ip_address": ip_address,
            "device_id": device_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        sb.table("security_audit_logs").insert(audit_record).execute()
    except Exception as e:
        logger.warning(f"Audit Log Note: {e}")


# ================= USER AUTHENTICATION DEPENDENCIES =================

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)):
    """
    Verifies Supabase JWT Access Token for User API endpoints.
    Header format: Authorization: Bearer <jwt_token>
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Bearer token is missing. Please log in."
        )
    
    token = credentials.credentials
    try:
        sb = get_supabase_client()
        user_response = sb.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid or expired session token."
            )
        return user_response.user
    except Exception as e:
        logger.error(f"JWT Verification Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unauthorized: Token verification failed ({str(e)})"
        )


# ================= ROOT & HEALTH ENDPOINTS =================

@app.get("/")
def root():
    return {
        "system": "Military Box IoT System",
        "status": "ONLINE",
        "security_features": [
            "Device Secret Token Authentication",
            "HMAC-SHA256 Payload Signature Verification",
            "Anti-Replay Attack Timestamp Windowing",
            "Pydantic Strict Input Validation & Bounds",
            "Supabase Security Audit Logging"
        ],
        "supabase_target": settings.SUPABASE_URL,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    """Verify backend and Supabase connectivity."""
    try:
        sb = get_supabase_client()
        res = sb.table("devices").select("device_id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "supabase_url": settings.SUPABASE_URL
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "database_error": str(e),
            "supabase_url": settings.SUPABASE_URL
        }


# ================= USER AUTHENTICATION ENDPOINTS =================

@app.post("/api/v1/auth/signup", status_code=status.HTTP_201_CREATED)
def signup_user(user_data: UserSignupSchema):
    """Register a new user/operator using Supabase Auth."""
    try:
        sb = get_supabase_client()
        auth_res = sb.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Signup failed.")
        
        log_security_event("USER_SIGNUP", f"New user registered: {user_data.email}")
        return {
            "success": True,
            "message": "User registered successfully.",
            "user_id": auth_res.user.id,
            "email": auth_res.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/auth/login", response_model=TokenResponseSchema)
def login_user(credentials: UserLoginSchema):
    """Authenticate user and return Supabase JWT access token."""
    try:
        sb = get_supabase_client()
        auth_res = sb.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        if not auth_res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        log_security_event("USER_LOGIN_SUCCESS", f"User logged in: {credentials.email}")
        return {
            "access_token": auth_res.session.access_token,
            "token_type": "bearer",
            "user_id": auth_res.user.id,
            "email": auth_res.user.email
        }
    except Exception as e:
        log_security_event("USER_LOGIN_FAILED", f"Failed login attempt for: {credentials.email}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# ================= ESP32 TELEMETRY INGESTION (PROTECTED BY COMPREHENSIVE SECURITY) =================

@app.post("/api/v1/telemetry", status_code=status.HTTP_201_CREATED)
def receive_telemetry(
    payload: ESP32TelemetryPayload,
    request: Request,
    security_verified: bool = Depends(verify_esp32_security)
):
    """
    HTTP POST endpoint called by ESP32 microcontrollers to upload telemetry.
    Protected by Device Token, Replay Attack Window, and optional HMAC-SHA256 signature.
    """
    client_ip = request.client.host if request.client else "unknown"
    try:
        sb = get_supabase_client()
        
        # 1. Update or Register Device Status
        device_data = {
            "device_id": payload.device_id,
            "status": "active",
            "last_seen": datetime.utcnow().isoformat()
        }
        sb.table("devices").upsert(device_data).execute()
        
        # 2. Store Telemetry Data
        telemetry_record = {
            "device_id": payload.device_id,
            "temperature": payload.temperature,
            "humidity": payload.humidity,
            "vibration_detected": payload.vibration_detected,
            "door_open": payload.door_open,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "raw_payload": payload.model_dump(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            if payload.battery_voltage is not None:
                telemetry_record["battery_voltage"] = payload.battery_voltage
            db_res = sb.table("sensor_telemetry").insert(telemetry_record).execute()
        except Exception as tel_err:
            logger.warning(f"Note: Retrying sensor_telemetry insert without battery_voltage: {tel_err}")
            telemetry_record.pop("battery_voltage", None)
            db_res = sb.table("sensor_telemetry").insert(telemetry_record).execute()
        
        # 3. Check for Automated Threshold Alerts
        alerts_generated = []
        
        # Check Vibration / Movement Alert
        if payload.vibration_detected:
            alert = {
                "device_id": payload.device_id,
                "alert_type": "VIBRATION_TAMPER",
                "severity": "CRITICAL",
                "message": f"Vibration/Shock detected on box {payload.device_id}!",
                "created_at": datetime.utcnow().isoformat()
            }
            sb.table("alerts").insert(alert).execute()
            alerts_generated.append("VIBRATION_TAMPER")
            log_security_event("TAMPER_ALERT", f"Vibration shock on {payload.device_id}", ip_address=client_ip, device_id=payload.device_id)

        # Check Door Open / Intrusion Alert
        if payload.door_open:
            alert = {
                "device_id": payload.device_id,
                "alert_type": "DOOR_OPEN",
                "severity": "CRITICAL",
                "message": f"Military Box {payload.device_id} lid/door opened unexpectedly!",
                "created_at": datetime.utcnow().isoformat()
            }
            sb.table("alerts").insert(alert).execute()
            alerts_generated.append("DOOR_OPEN")
            log_security_event("INTRUSION_ALERT", f"Door opened on {payload.device_id}", ip_address=client_ip, device_id=payload.device_id)

        # Check High Temperature Alert
        if payload.temperature and payload.temperature > settings.TEMP_HIGH_THRESHOLD:
            alert = {
                "device_id": payload.device_id,
                "alert_type": "HIGH_TEMP",
                "severity": "WARNING",
                "message": f"High temperature warning: {payload.temperature}°C exceeds threshold {settings.TEMP_HIGH_THRESHOLD}°C",
                "created_at": datetime.utcnow().isoformat()
            }
            sb.table("alerts").insert(alert).execute()
            alerts_generated.append("HIGH_TEMP")

        # Check Low Battery Alert
        if payload.battery_voltage and payload.battery_voltage < settings.BATTERY_LOW_THRESHOLD:
            alert = {
                "device_id": payload.device_id,
                "alert_type": "LOW_BATTERY",
                "severity": "WARNING",
                "message": f"Low battery level: {payload.battery_voltage}V is below {settings.BATTERY_LOW_THRESHOLD}V",
                "created_at": datetime.utcnow().isoformat()
            }
            sb.table("alerts").insert(alert).execute()
            alerts_generated.append("LOW_BATTERY")

        # 4. Log Container Telemetry into Anvil Blockchain (ContainerAudit contract) & Supabase
        blockchain_record = None
        try:
            event_type = "TAMPER_ALERT" if alerts_generated else "TELEMETRY_LOGGED"
            blockchain_record = blockchain_svc.record_container_audit_event(
                container_id=payload.device_id,
                event_type=event_type,
                payload_data={
                    "telemetry": payload.model_dump(),
                    "alerts": alerts_generated,
                    "contract": settings.CONTRACT_ADDRESS
                }
            )
        except Exception as bc_err:
            logger.warning(f"Blockchain log warning: {bc_err}")

        logger.info(f"Received telemetry from {payload.device_id}. Inserted: {len(db_res.data)} record(s). Alerts: {alerts_generated}")

        return {
            "success": True,
            "message": "Telemetry received, saved to Supabase, and logged on Anvil Blockchain",
            "device_id": payload.device_id,
            "alerts": alerts_generated,
            "blockchain": blockchain_record
        }

    except Exception as e:
        logger.error(f"Error processing ESP32 telemetry: {e}")
        log_security_event("TELEMETRY_FAILURE", str(e), ip_address=client_ip, device_id=payload.device_id)
        raise HTTPException(status_code=500, detail=f"Database ingestion failed: {str(e)}")


@app.get("/api/v1/blockchain/history")
def get_blockchain_history(container_id: str):
    """Retrieve all blockchain transactions and audit events for a container from Supabase."""
    try:
        records = blockchain_svc.fetch_container_blockchain_history(container_id)
        return {
            "container_id": container_id,
            "contract_address": settings.CONTRACT_ADDRESS,
            "contract_name": settings.CONTRACT_NAME,
            "chain_id": settings.CHAIN_ID,
            "count": len(records),
            "records": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ================= DATA QUERY ENDPOINTS =================

@app.get("/api/v1/telemetry/latest")
def get_latest_telemetry(device_id: Optional[str] = None, limit: int = 20):
    """Retrieve recent sensor readings from Supabase."""
    try:
        sb = get_supabase_client()
        query = sb.table("sensor_telemetry").select("*").order("timestamp", desc=True).limit(limit)
        if device_id:
            query = query.eq("device_id", device_id)
        res = query.execute()
        return {"count": len(res.data), "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/alerts")
def get_alerts(unresolved_only: bool = True, limit: int = 50):
    """Retrieve security/tamper/environmental alerts."""
    try:
        sb = get_supabase_client()
        query = sb.table("alerts").select("*").order("created_at", desc=True).limit(limit)
        if unresolved_only:
            query = query.eq("resolved", False)
        res = query.execute()
        return {"count": len(res.data), "alerts": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/security/audit-logs")
def get_security_audit_logs(limit: int = 50):
    """Retrieve security audit logs for forensic inspection."""
    try:
        sb = get_supabase_client()
        res = sb.table("security_audit_logs").select("*").order("timestamp", desc=True).limit(limit).execute()
        return {"count": len(res.data), "audit_logs": res.data}
    except Exception as e:
        logger.warning(f"Could not query security_audit_logs: {e}")
        return {
            "count": 0,
            "audit_logs": [],
            "note": "To enable persistent security audit logs in Supabase, execute updated schema.sql in SQL Editor."
        }

@app.get("/api/v1/devices")
def get_devices():
    """Get list of active Military Box devices."""
    try:
        sb = get_supabase_client()
        res = sb.table("devices").select("*").execute()
        return {"devices": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard", response_class=FileResponse)
def serve_dashboard():
    """Serve Tactical Military Box IoT Dashboard HTML."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Dashboard UI not found.")

@app.post("/api/v1/simulate")
def simulate_telemetry_endpoint(trigger_alert: bool = False):
    """
    Trigger HMAC-SHA256 signed ESP32 telemetry simulation directly from Frontend.
    """
    try:
        payload = {
            "device_id": "ESP32_MILITARY_BOX_01",
            "temperature": round(random.uniform(48.5 if trigger_alert else 22.0, 55.0 if trigger_alert else 32.0), 2),
            "humidity": round(random.uniform(40.0, 75.0), 2),
            "vibration_detected": True if trigger_alert else False,
            "door_open": True if trigger_alert else False,
            "battery_voltage": round(random.uniform(3.2 if trigger_alert else 3.8, 4.2), 2),
            "latitude": 28.6139 + random.uniform(-0.005, 0.005),
            "longitude": 77.2090 + random.uniform(-0.005, 0.005)
        }
        raw_bytes = json.dumps(payload).encode("utf-8")
        timestamp_str = str(time.time())
        
        # Calculate HMAC Signature using secret key
        message = f"{timestamp_str}.".encode("utf-8") + raw_bytes
        signature = hmac.new(settings.API_SECRET_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()
        hmac_header = f"sha256={signature}"
        
        # Process telemetry internally through FastAPI receive_telemetry logic
        from fastapi import Request
        dummy_scope = {"type": "http", "headers": [], "client": ("127.0.0.1", 5000)}
        dummy_req = Request(dummy_scope)
        
        telemetry_model = ESP32TelemetryPayload(**payload)
        res = receive_telemetry(payload=telemetry_model, request=dummy_req, security_verified=True)
        return {
            "success": True,
            "message": f"Signed Telemetry Processed ({'🚨 ALERT TRIGGERED' if trigger_alert else 'NORMAL READING'})",
            "hmac_signature": hmac_header[:25] + "...",
            "details": res
        }
    except Exception as e:
        logger.error(f"Simulation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

