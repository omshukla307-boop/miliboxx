import json
import os

from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

load_dotenv()

RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "https://polygon-amoy-bor-rpc.publicnode.com")
CONTRACT_ADDRESS = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS", "0x922289128a62Ca288Fd9D04558cacbe6842955fa")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "0x6f556327028df3bd3d76af89197bcdf10cc7c29708cf2ced7b7dfb50b230b04f")
WALLET_ADDRESS = os.getenv("BLOCKCHAIN_WALLET_ADDRESS", "0x5b14aC333307b348c501dfe4169487d60cE16dFe")

w3 = Web3(Web3.HTTPProvider(RPC_URL)) if RPC_URL else None

if w3:
    try:
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    except Exception:
        pass

contract = None

try:
    if w3 and w3.is_connected() and CONTRACT_ADDRESS:
        base_dir = os.path.dirname(__file__)
        possible_paths = [
            os.path.join(base_dir, "..", "blockchain", "abi", "ContainerAudit.json"),
            os.path.join(base_dir, "..", "..", "container_audit_abi.json"),
            "app/blockchain/abi/ContainerAudit.json",
        ]
        abi_path = next((p for p in possible_paths if os.path.exists(p)), None)
        if abi_path:
            with open(abi_path, "r") as f:
                CONTRACT_ABI = json.load(f)

            contract_address = Web3.to_checksum_address(CONTRACT_ADDRESS)

            contract = w3.eth.contract(
                address=contract_address,
                abi=CONTRACT_ABI
            )
except Exception:
    contract = None


def blockchain_status():
    connected = False
    chain_id = None
    contract_deployed = False

    if w3:
        try:
            connected = w3.is_connected()
            if connected:
                chain_id = w3.eth.chain_id
                if CONTRACT_ADDRESS:
                    address = Web3.to_checksum_address(CONTRACT_ADDRESS)
                    contract_deployed = (w3.eth.get_code(address) != b"")
        except Exception:
            connected = False

    return {
        "connected": connected,
        "chain_id": chain_id,
        "contract_address": CONTRACT_ADDRESS or "Not set",
        "contract_deployed": contract_deployed,
        "rpc_url_configured": bool(RPC_URL),
    }


def record_event(
    container_id: str,
    event_type: int,
    latitude: int,
    longitude: int,
    details: str,
):
    if not w3.is_connected():
        raise RuntimeError("Blockchain RPC is not connected")

    if contract is None:
        raise RuntimeError("Blockchain contract is not initialized")

    if not PRIVATE_KEY:
        raise RuntimeError("BLOCKCHAIN_PRIVATE_KEY is not configured")

    if not WALLET_ADDRESS:
        raise RuntimeError("BLOCKCHAIN_WALLET_ADDRESS is not configured")

    wallet = Web3.to_checksum_address(WALLET_ADDRESS)

    account = w3.eth.account.from_key(PRIVATE_KEY)

    if account.address.lower() != wallet.lower():
        raise RuntimeError(
            "BLOCKCHAIN_PRIVATE_KEY does not match BLOCKCHAIN_WALLET_ADDRESS"
        )

    nonce = w3.eth.get_transaction_count(wallet, "pending")

    transaction = contract.functions.recordEvent(
        container_id,
        event_type,
        latitude,
        longitude,
        details,
    ).build_transaction(
        {
            "from": wallet,
            "nonce": nonce,
            "chainId": w3.eth.chain_id,
        }
    )

    gas_estimate = w3.eth.estimate_gas(transaction)
    transaction["gas"] = int(gas_estimate * 1.2)

    latest_block = w3.eth.get_block("latest")
    base_fee = latest_block.get("baseFeePerGas")

    if base_fee is not None:
        priority_fee = w3.to_wei(25, "gwei")
        transaction["maxPriorityFeePerGas"] = priority_fee
        transaction["maxFeePerGas"] = (base_fee * 2) + priority_fee
    else:
        transaction["gasPrice"] = w3.eth.gas_price

    signed_transaction = w3.eth.account.sign_transaction(
        transaction,
        PRIVATE_KEY,
    )

    tx_hash = w3.eth.send_raw_transaction(
        signed_transaction.raw_transaction
    )

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return {
        "transaction_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
        "status": receipt.status,
    }


def get_container_events(container_id: str):
    if not w3.is_connected():
        raise RuntimeError("Blockchain RPC is not connected")

    if contract is None:
        raise RuntimeError("Blockchain contract is not initialized")

    event_ids = contract.functions.getContainerEventIds(
        container_id
    ).call()

    events = []

    for event_id in event_ids:
        event = contract.functions.getEvent(
            event_id
        ).call()

        events.append({
            "event_id": int(event[0]),
            "container_id": event[1],
            "event_type": int(event[2]),
            "timestamp": int(event[3]),
            "latitude": int(event[4]) / 1_000_000,
            "longitude": int(event[5]) / 1_000_000,
            "details": event[6],
        })

    return events
