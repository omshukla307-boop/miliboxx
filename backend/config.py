import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://fpxpyvfeionyxfptigmy.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # ESP32 Device Authentication Token
    API_SECRET_KEY: str = os.getenv("API_SECRET_KEY", "military_box_secret_token_2026")
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Alert Thresholds
    TEMP_HIGH_THRESHOLD: float = 45.0  # Celsius
    TEMP_LOW_THRESHOLD: float = -10.0  # Celsius
    BATTERY_LOW_THRESHOLD: float = 3.3  # Volts

    # Anvil Blockchain Configuration
    BLOCKCHAIN_API_URL: str = os.getenv("BLOCKCHAIN_API_URL", "http://127.0.0.1:8545")
    BLOCKCHAIN_API_KEY: str = os.getenv("BLOCKCHAIN_API_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
    ANVIL_RPC_URL: str = os.getenv("ANVIL_RPC_URL", "http://127.0.0.1:8545")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "31337"))
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "0x9fE46736679d2D9a65F0992F2272dE9f3c7FA6e0")
    CONTRACT_NAME: str = os.getenv("CONTRACT_NAME", "ContainerAudit")
    WALLET_ADDRESS: str = os.getenv("WALLET_ADDRESS", "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")

settings = Settings()
