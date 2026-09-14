import hmac
import hashlib
import time
import logging
from fastapi import HTTPException, Header, Request, status
from typing import Optional
from config import settings

logger = logging.getLogger("military_box_security")

# Maximum allowed timestamp drift (5 minutes) to prevent Replay Attacks
MAX_TIMESTAMP_DRIFT_SECONDS = 300

def verify_hmac_signature(
    raw_body: bytes,
    signature: str,
    timestamp: str,
    secret_key: str
) -> bool:
    """
    Verifies HMAC-SHA256 signature of the HTTP request payload.
    Signature format: sha256=<hex_digest>
    Calculated over: timestamp.raw_body
    """
    if not signature or not signature.startswith("sha256="):
        return False
        
    expected_prefix = "sha256="
    provided_hash = signature[len(expected_prefix):]
    
    # Calculate expected HMAC-SHA256
    message = f"{timestamp}.".encode("utf-8") + raw_body
    computed_hash = hmac.new(
        secret_key.encode("utf-8"),
        message,
        hashlib.sha256
    ).hexdigest()
    
    # Use hmac.compare_digest to prevent Timing Attacks
    return hmac.compare_digest(computed_hash.lower(), provided_hash.lower())


async def verify_esp32_security(
    request: Request,
    x_device_token: Optional[str] = Header(None, alias="X-Device-Token"),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    x_timestamp: Optional[str] = Header(None, alias="X-Timestamp")
):
    """
    Comprehensive Security Dependency for ESP32 Telemetry Requests:
    1. Validates Device Authentication Token.
    2. Enforces Replay Attack Protection (Timestamp Window).
    3. Validates HMAC-SHA256 Payload Signature (if provided).
    """
    client_ip = request.client.host if request.client else "unknown"

    # 1. Device Token Authentication
    if not x_device_token or x_device_token != settings.API_SECRET_KEY:
        logger.warning(f"🚨 SECURITY ALERT: Unauthorized token attempt from IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Violation: Invalid or missing 'X-Device-Token' header."
        )

    # 2. Replay Attack Protection (Timestamp Validation)
    if x_timestamp:
        try:
            req_time = float(x_timestamp)
            current_time = time.time()
            drift = abs(current_time - req_time)
            
            if drift > MAX_TIMESTAMP_DRIFT_SECONDS:
                logger.warning(f"🚨 SECURITY ALERT: Replay attack detected from IP: {client_ip}. Drift: {drift}s")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Security Violation: Request timestamp expired. Drift: {int(drift)}s"
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 'X-Timestamp' header format."
            )

    # 3. HMAC Payload Signature Verification (if signature header provided)
    if x_signature:
        if not x_timestamp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Violation: 'X-Timestamp' header is required when 'X-Signature' is present."
            )
            
        raw_body = await request.body()
        is_valid = verify_hmac_signature(
            raw_body=raw_body,
            signature=x_signature,
            timestamp=x_timestamp,
            secret_key=settings.API_SECRET_KEY
        )
        
        if not is_valid:
            logger.warning(f"🚨 SECURITY ALERT: Tampered payload / invalid HMAC signature from IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: HMAC-SHA256 signature verification failed. Tampered payload detected!"
            )

    return True
