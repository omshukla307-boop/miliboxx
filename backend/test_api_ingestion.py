from fastapi.testclient import TestClient
from main import app
from security import verify_hmac_signature
import json
import hmac
import hashlib
import time
import sys

# Ensure UTF-8 output
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

client = TestClient(app)
SECRET_KEY = "military_box_secret_token_2026"

def compute_sig(body_bytes: bytes, ts_str: str) -> str:
    msg = f"{ts_str}.".encode("utf-8") + body_bytes
    sig = hmac.new(SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return f"sha256={sig}"

def test_hardened_security_suite():
    print("==========================================")
    print("  Testing Hardened Security & Anti-Tamper ")
    print("==========================================")
    
    # 1. Health check
    print("1. Checking API Health Endpoint (/health)...")
    res = client.get("/health")
    assert res.status_code == 200
    print(f"   Status Code: {res.status_code} OK\n")
    
    # 2. Test Unauthorized Request (Missing Token)
    print("2. Testing Unauthorized POST without X-Device-Token...")
    sample = {"device_id": "ESP32_MILITARY_BOX_01", "temperature": 25.0}
    r2 = client.post("/api/v1/telemetry", json=sample)
    print(f"   Status Code: {r2.status_code} (Expected 401)")
    assert r2.status_code == 401
    print(f"   Response: {r2.json()}\n")
    
    # 3. Test Replay Attack (Expired Timestamp: 10 minutes ago)
    print("3. Testing Replay Attack Protection with expired timestamp (10 mins old)...")
    old_ts = str(time.time() - 600)
    body_bytes = json.dumps(sample).encode("utf-8")
    old_sig = compute_sig(body_bytes, old_ts)
    headers_replay = {
        "X-Device-Token": SECRET_KEY,
        "X-Timestamp": old_ts,
        "X-Signature": old_sig
    }
    r3 = client.post("/api/v1/telemetry", content=body_bytes, headers=headers_replay)
    print(f"   Status Code: {r3.status_code} (Expected 401)")
    assert r3.status_code == 401
    print(f"   Response: {r3.json()}\n")
    
    # 4. Test Payload Tampering (Invalid HMAC Signature)
    print("4. Testing Payload Tampering Detection (Invalid HMAC signature)...")
    now_ts = str(time.time())
    headers_bad_sig = {
        "X-Device-Token": SECRET_KEY,
        "X-Timestamp": now_ts,
        "X-Signature": "sha256=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    }
    r4 = client.post("/api/v1/telemetry", content=body_bytes, headers=headers_bad_sig)
    print(f"   Status Code: {r4.status_code} (Expected 403)")
    assert r4.status_code == 403
    print(f"   Response: {r4.json()}\n")

    # 5. Test Invalid Input Bounds (Temperature = 999.0°C)
    print("5. Testing Strict Input Validation & Bounds (Temp = 999°C)...")
    invalid_bounds = {"device_id": "ESP32_MILITARY_BOX_01", "temperature": 999.0}
    r5 = client.post("/api/v1/telemetry", json=invalid_bounds, headers={"X-Device-Token": SECRET_KEY})
    print(f"   Status Code: {r5.status_code} (Expected 422 Unprocessable Entity)")
    assert r5.status_code == 422
    print(f"   Response: Validation Error Blocked!\n")

    # 6. Test Valid Signed Ingestion
    print("6. Testing Valid HMAC-SHA256 Signed Ingestion...")
    valid_payload = {
        "device_id": "ESP32_MILITARY_BOX_01",
        "temperature": 49.5, # Alert
        "humidity": 65.0,
        "vibration_detected": True, # Alert
        "door_open": False,
        "battery_voltage": 3.90,
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    valid_bytes = json.dumps(valid_payload).encode("utf-8")
    valid_ts = str(time.time())
    valid_sig = compute_sig(valid_bytes, valid_ts)
    valid_headers = {
        "Content-Type": "application/json",
        "X-Device-Token": SECRET_KEY,
        "X-Timestamp": valid_ts,
        "X-Signature": valid_sig
    }
    r6 = client.post("/api/v1/telemetry", content=valid_bytes, headers=valid_headers)
    print(f"   Status Code: {r6.status_code} (Expected 201 Created)")
    assert r6.status_code == 201
    print(f"   Response: {r6.json()}\n")

    # 7. Query Security Audit Logs
    print("7. Querying Security Audit Logs (GET /api/v1/security/audit-logs)...")
    r7 = client.get("/api/v1/security/audit-logs")
    print(f"   Status Code: {r7.status_code}")
    print(f"   Audit Logs Count: {r7.json().get('count')}")
    print(f"   Audit Logs Items: {r7.json().get('audit_logs')[:2]}\n")
    assert r7.status_code == 200

    print("✅ HARDENED SECURITY TEST SUITE PASSED 100%!")

if __name__ == "__main__":
    test_hardened_security_suite()
