from datetime import datetime

from pydantic import BaseModel


class BoxData(BaseModel):

    # Device
    device_id: str

    # Time
    timestamp: datetime

    # DHT22
    temperature: float | None = None
    humidity: float | None = None

    # DS18B20
    probe_temperature: float | None = None

    # LDR - Lid Tamper
    tamper: bool = False

    # MPU6050 - Shock
    shock: bool = False

    # HC-SR501 PIR - Motion
    motion: bool = False

    # Battery percentage
    battery: float | None = None

    # GPS
    latitude: float | None = None
    longitude: float | None = None

    # Future Camera
    camera_triggered: bool = False
    image_id: str | None = None
    image_path: str | None = None