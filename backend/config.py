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

    # Polygon Amoy Blockchain Configuration
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "https://polygon-amoy-bor-rpc.publicnode.com")
    BLOCKCHAIN_API_URL: str = os.getenv("BLOCKCHAIN_API_URL", BLOCKCHAIN_RPC_URL)
    BLOCKCHAIN_PRIVATE_KEY: str = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "0x6f556327028df3bd3d76af89197bcdf10cc7c29708cf2ced7b7dfb50b230b04f")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "80002"))
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "0x922289128a62Ca288Fd9D04558cacbe6842955fa")
    CONTRACT_NAME: str = os.getenv("CONTRACT_NAME", "ContainerAudit")
    WALLET_ADDRESS: str = os.getenv("WALLET_ADDRESS", "0x5b14aC333307b348c501dfe4169487d60cE16dFe")

settings = Settings()
