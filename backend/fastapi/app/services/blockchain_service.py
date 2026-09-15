import json
import os

from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

load_dotenv()

RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL")
CONTRACT_ADDRESS = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
WALLET_ADDRESS = os.getenv("BLOCKCHAIN_WALLET_ADDRESS")

w3 = Web3(Web3.HTTPProvider(RPC_URL))

w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

contract = None

if w3.is_connected() and CONTRACT_ADDRESS:
    with open("app/blockchain/abi/ContainerAudit.json", "r") as f:
        CONTRACT_ABI = json.load(f)

    contract_address = Web3.to_checksum_address(CONTRACT_ADDRESS)

    contract = w3.eth.contract(
        address=contract_address,
        abi=CONTRACT_ABI
    )


def blockchain_status():
    connected = w3.is_connected()

    result = {
        "connected": connected,
        "chain_id": w3.eth.chain_id if connected else None,
        "contract_address": CONTRACT_ADDRESS,
        "contract_deployed": False,
    }

    if connected and CONTRACT_ADDRESS:
        address = Web3.to_checksum_address(CONTRACT_ADDRESS)
        result["contract_deployed"] = (
            w3.eth.get_code(address) != b""
        )

    return result


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
