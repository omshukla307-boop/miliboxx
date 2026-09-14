"""
ESP32 Telemetry Simulator for Military Box (Hardened & Signed)
Generates HMAC-SHA256 payload signatures and timestamp headers for secure ingestion.
"""

import requests
import time
import random
import json
import hmac
import hashlib
import sys

# Ensure UTF-8 output for Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SERVER_URL = "http://localhost:8000/api/v1/telemetry"
DEVICE_ID = "ESP32_MILITARY_BOX_01"
DEVICE_SECRET_TOKEN = "military_box_secret_token_2026"

def calculate_hmac_signature(raw_payload_bytes: bytes, timestamp_str: str, secret_key: str) -> str:
    """Calculates HMAC-SHA256 signature over timestamp.payload."""
    message = f"{timestamp_str}.".encode("utf-8") + raw_payload_bytes
    signature = hmac.new(secret_key.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return f"sha256={signature}"

def generate_telemetry_payload(trigger_alert: bool = False):
    return {
        "device_id": DEVICE_ID,
        "temperature": round(random.uniform(22.0, 48.0 if trigger_alert else 32.0), 2),
        "humidity": round(random.uniform(40.0, 75.0), 2),
        "vibration_detected": True if trigger_alert else random.choice([False, False, False, True]),
        "door_open": True if trigger_alert else random.choice([False, False, False, False]),
        "battery_voltage": round(random.uniform(3.2 if trigger_alert else 3.7, 4.2), 2),
        "latitude": 28.6139 + random.uniform(-0.005, 0.005),
        "longitude": 77.2090 + random.uniform(-0.005, 0.005)
    }

def send_telemetry():
    print(f"📡 Starting HMAC-Signed ESP32 Telemetry Simulator for Box: {DEVICE_ID}")
    print(f"Target Endpoint: {SERVER_URL}\n")
    
    for i in range(1, 6):
        trigger_alert = (i == 3)
        payload = generate_telemetry_payload(trigger_alert)
        raw_body_bytes = json.dumps(payload).encode("utf-8")
        
        # Calculate timestamp and HMAC signature
        timestamp_str = str(time.time())
        hmac_sig = calculate_hmac_signature(raw_body_bytes, timestamp_str, DEVICE_SECRET_TOKEN)
        
        print(f"[{i}/5] Sending Signed Payload:")
        print(f"      Temp: {payload['temperature']}°C | Hum: {payload['humidity']}% | Vibration: {payload['vibration_detected']} | Signature: {hmac_sig[:25]}...")
        
        try:
            headers = {
                "Content-Type": "application/json",
                "X-Device-Token": DEVICE_SECRET_TOKEN,
                "X-Timestamp": timestamp_str,
                "X-Signature": hmac_sig
            }
            response = requests.post(SERVER_URL, data=raw_body_bytes, headers=headers, timeout=5)
            if response.status_code in [200, 201]:
                res_data = response.json()
                print(f"      ✅ Success: {res_data.get('message')}")
                if res_data.get('alerts'):
                    print(f"      🚨 Alerts Generated: {res_data.get('alerts')}")
            else:
                print(f"      ❌ Server Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"      ❌ Connection failed (is FastAPI running?): {e}")
            
        time.sleep(2)

if __name__ == "__main__":
    send_telemetry()
