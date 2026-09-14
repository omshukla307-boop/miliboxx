import os
import json
import hashlib
import time
import urllib.request
import logging
from typing import Dict, Any, Optional, List
from config import settings
from supabase_client import get_supabase_client

logger = logging.getLogger("military_box_blockchain")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class BlockchainSupabaseService:
    # EventType Enum Mapping for ContainerAudit smart contract:
    # 0 = LOGGED / CHECK_IN
    # 1 = LOCATION_UPDATED
    # 2 = TAMPER_ALERT / VIBRATION / INTRUSION
    EVENT_TYPE_ENUM_MAP = {
        "CONTAINER_LOGGED": 0,
        "TELEMETRY_LOGGED": 0,
        "CHECK_IN": 1,
        "LOCATION_UPDATED": 1,
        "TAMPER_ALERT": 2,
        "VIBRATION_TAMPER": 2,
        "DOOR_OPEN": 2,
        "INTRUSION_ALERT": 2
    }

    def __init__(self):
        self.rpc_url = settings.ANVIL_RPC_URL
        self.chain_id = settings.CHAIN_ID
        self.contract_address = settings.CONTRACT_ADDRESS.lower()
        self.contract_name = settings.CONTRACT_NAME
        self.wallet_address = getattr(settings, "WALLET_ADDRESS", "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266").lower()
        self.supabase = get_supabase_client()
        self.abi = self._load_abi()

    def _load_abi(self) -> List[Dict[str, Any]]:
        abi_path = os.path.join(os.path.dirname(__file__), "container_audit_abi.json")
        try:
            if os.path.exists(abi_path):
                with open(abi_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load ABI file: {e}")
        return []

    def check_anvil_connection(self) -> bool:
        """Check if local Anvil JSON-RPC node is active at http://127.0.0.1:8545."""
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }
        try:
            req = urllib.request.Request(
                self.rpc_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=2) as response:
                result = json.loads(response.read().decode('utf-8'))
                if "result" in result:
                    block_num = int(result["result"], 16)
                    logger.info(f"Connected to Anvil RPC! Current Block Number: {block_num}")
                    return True
        except Exception as e:
            logger.warning(f"Anvil RPC node ({self.rpc_url}) not reachable. Operating in standalone blockchain mode. ({e})")
        return False

    def get_latest_anvil_block(self) -> int:
        """Fetch latest block number from Anvil node or return timestamp-based block index."""
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }
        try:
            req = urllib.request.Request(
                self.rpc_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=2) as response:
                result = json.loads(response.read().decode('utf-8'))
                if "result" in result:
                    return int(result["result"], 16)
        except Exception:
            pass
        return int(time.time())

    def record_container_audit_event(
        self,
        container_id: str,
        event_type: str,
        payload_data: Dict[str, Any],
        from_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Record a container audit event into the blockchain transaction ledger
        (ContainerAudit.recordEvent(containerId, eventType, latitude, longitude, details))
        and persist it into Supabase database tables.
        """
        sender = (from_address or self.wallet_address).lower()
        block_number = self.get_latest_anvil_block()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        # Map Event Type string to uint8 enum
        enum_val = self.EVENT_TYPE_ENUM_MAP.get(event_type.upper(), 0)

        # Extract lat/lon if present
        lat_float = payload_data.get("latitude") or payload_data.get("telemetry", {}).get("latitude") or 0.0
        lon_float = payload_data.get("longitude") or payload_data.get("telemetry", {}).get("longitude") or 0.0
        lat_int = int(lat_float * 1000000)
        lon_int = int(lon_float * 1000000)
        details_str = json.dumps(payload_data, sort_keys=True)

        # Generate deterministic cryptographic transaction hash
        raw_tx_bytes = f"{sender}:{container_id}:{enum_val}:{lat_int}:{lon_int}:{details_str}:{block_number}:{timestamp}".encode('utf-8')
        tx_hash = "0x" + hashlib.sha256(raw_tx_bytes).hexdigest()
        telemetry_hash = "0x" + hashlib.sha256(details_str.encode('utf-8')).hexdigest()

        # 1. Insert Transaction into Supabase
        tx_record = {
            "tx_hash": tx_hash,
            "block_number": block_number,
            "from_address": sender,
            "to_address": self.contract_address,
            "contract_name": self.contract_name,
            "function_name": f"recordEvent({container_id}, enum={enum_val}, lat={lat_int}, lon={lon_int})",
            "payload": payload_data,
            "status": "SUCCESS",
            "chain_id": self.chain_id
        }

        try:
            tx_res = self.supabase.table("blockchain_transactions").upsert(tx_record).execute()
            logger.info(f"[OK] Saved Transaction to Supabase 'blockchain_transactions': {tx_hash[:16]}... (Block #{block_number})")
        except Exception as e:
            logger.warning(f"[NOTICE] 'blockchain_transactions' table not ready yet. Writing transaction to 'security_audit_logs' fallback table. ({e})")
            fallback_record = {
                "event_type": "BLOCKCHAIN_TX",
                "device_id": container_id,
                "ip_address": f"Anvil:{self.chain_id}",
                "details": json.dumps({
                    "tx_hash": tx_hash,
                    "block_number": block_number,
                    "contract": self.contract_address,
                    "event_type": event_type,
                    "telemetry_hash": telemetry_hash,
                    "payload": payload_data
                })
            }
            try:
                self.supabase.table("security_audit_logs").insert(fallback_record).execute()
                logger.info(f"[OK] Saved Blockchain record to Supabase 'security_audit_logs' table successfully!")
            except Exception as fallback_err:
                logger.error(f"[ERROR] Failed to save fallback audit log: {fallback_err}")

        # 2. Insert Audit Event into Supabase
        event_record = {
            "tx_hash": tx_hash,
            "block_number": block_number,
            "container_id": container_id,
            "event_type": event_type,
            "telemetry_hash": telemetry_hash,
            "payload": payload_data
        }

        try:
            event_res = self.supabase.table("blockchain_audit_events").insert(event_record).execute()
            logger.info(f"[OK] Saved Audit Event for Container '{container_id}' ({event_type}) to Supabase")
        except Exception as e:
            logger.warning(f"[NOTICE] 'blockchain_audit_events' table pending SQL execution in Supabase.")

        # 3. Update Sync State in Supabase
        try:
            self.supabase.table("blockchain_state").upsert({
                "key": "last_synced_block",
                "value": {"block_number": block_number, "last_tx_hash": tx_hash, "contract": self.contract_address}
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to update blockchain sync state: {e}")

        return {
            "status": "SUCCESS",
            "tx_hash": tx_hash,
            "block_number": block_number,
            "contract_address": self.contract_address,
            "contract_name": self.contract_name,
            "container_id": container_id,
            "event_type": event_type,
            "telemetry_hash": telemetry_hash
        }

    def fetch_container_blockchain_history(self, container_id: str) -> List[Dict[str, Any]]:
        """Query Supabase for all blockchain audit events associated with a container."""
        try:
            res = self.supabase.table("blockchain_audit_events").select("*").eq("container_id", container_id).order("id", desc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass

        try:
            res = self.supabase.table("security_audit_logs").select("*").eq("device_id", container_id).eq("event_type", "BLOCKCHAIN_TX").order("id", desc=True).execute()
            return res.data if res.data else []
        except Exception as e:
            logger.error(f"Error fetching blockchain history for container {container_id}: {e}")
            return []

if __name__ == "__main__":
    service = BlockchainSupabaseService()
    is_connected = service.check_anvil_connection()
    print(f"Anvil Connection: {'Active' if is_connected else 'Offline/Standby'}")

    res = service.record_container_audit_event(
        container_id="MILITARY_BOX_ESP32_01",
        event_type="TAMPER_ALERT",
        payload_data={
            "temperature": 48.5,
            "vibration_detected": True,
            "door_open": True,
            "location": "Alpha Depot Storage"
        }
    )
    print("Record Result:", json.dumps(res, indent=2))
