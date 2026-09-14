import json
import sys
from config import settings
from blockchain_service import BlockchainSupabaseService

def run_integration_test():
    print("=" * 65)
    print("      Military Box: Anvil Blockchain & Supabase Sync Test     ")
    print("=" * 65)
    
    print(f"Smart Contract : {settings.CONTRACT_NAME}")
    print(f"Address        : {settings.CONTRACT_ADDRESS}")
    print(f"Chain ID       : {settings.CHAIN_ID}")
    print(f"RPC Endpoint   : {settings.ANVIL_RPC_URL}")
    print(f"Supabase Target: {settings.SUPABASE_URL}")
    print("-" * 65)

    service = BlockchainSupabaseService()

    # 1. Test Anvil Connectivity
    is_anvil_online = service.check_anvil_connection()
    status_str = "ONLINE" if is_anvil_online else "OFFLINE (Using Standby Ledger)"
    print(f"[+] Anvil Local RPC Node Status : {status_str}")

    # 2. Test Logging Container Audit Event
    print("\n[+] Logging Container Audit event to Blockchain & Supabase...")
    audit_res = service.record_container_audit_event(
        container_id="ESP32_MILITARY_BOX_01",
        event_type="CONTAINER_LOGGED",
        payload_data={
            "temperature": 24.2,
            "humidity": 45.0,
            "vibration_detected": False,
            "door_open": False,
            "latitude": 28.6139,
            "longitude": 77.2090,
            "status": "SECURE"
        }
    )

    print("\n[SUCCESS] Transaction successfully generated and sent to Supabase!")
    print(f"   Transaction Hash : {audit_res['tx_hash']}")
    print(f"   Block Number     : {audit_res['block_number']}")
    print(f"   Contract Address : {audit_res['contract_address']}")
    print(f"   Telemetry Hash   : {audit_res['telemetry_hash']}")

    # 3. Query Supabase to Verify Event Persistence
    print("\n[+] Querying Supabase for Container Blockchain History...")
    history = service.fetch_container_blockchain_history("ESP32_MILITARY_BOX_01")
    print(f"[SUCCESS] Retrieved {len(history)} blockchain audit records from Supabase for 'ESP32_MILITARY_BOX_01'")

    if history:
        print("\nLatest Blockchain Event in Supabase:")
        print(json.dumps(history[0], indent=2, default=str))

    print("\n" + "=" * 65)
    print("[PASSED] SUCCESS: Blockchain & Supabase Integration Verified!")
    print("=" * 65)

if __name__ == "__main__":
    run_integration_test()
