import sys
from supabase_client import get_supabase_client
from config import settings

# Ensure UTF-8 output
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def print_project_status():
    print("==================================================")
    print("   Military Box - Live Project & System Status    ")
    print("==================================================")
    print(f"Target Supabase Project: {settings.SUPABASE_URL}")
    print("--------------------------------------------------")
    
    try:
        sb = get_supabase_client()
        
        # 1. Registered Devices
        devices_res = sb.table("devices").select("*").execute()
        devices = devices_res.data
        print(f"\n📱 Registered Devices ({len(devices)}):")
        for dev in devices:
            print(f"   • ID: {dev.get('device_id')} | Name: {dev.get('name')} | Status: {dev.get('status')} | Last Seen: {dev.get('last_seen')}")
            
        # 2. Total Telemetry Records
        telemetry_res = sb.table("sensor_telemetry").select("*", count="exact").limit(5).order("timestamp", desc=True).execute()
        print(f"\n📡 Telemetry Records (Total: {telemetry_res.count if hasattr(telemetry_res, 'count') else len(telemetry_res.data)}):")
        for record in telemetry_res.data:
            print(f"   • [{record.get('timestamp')}] Temp: {record.get('temperature')}°C | Hum: {record.get('humidity')}% | Vib: {record.get('vibration_detected')} | Door: {record.get('door_open')} | Batt: {record.get('battery_voltage')}V")
            
        # 3. Active Security Alerts
        alerts_res = sb.table("alerts").select("*").order("created_at", desc=True).limit(5).execute()
        print(f"\n🚨 Active Security Alerts ({len(alerts_res.data)}):")
        for alert in alerts_res.data:
            print(f"   • [{alert.get('severity')}] {alert.get('alert_type')}: {alert.get('message')} (At: {alert.get('created_at')})")
            
        print("\n✅ System status check completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error fetching status: {e}")

if __name__ == "__main__":
    print_project_status()
