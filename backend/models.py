from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any

class ESP32TelemetryPayload(BaseModel):
    device_id: str = Field(
        ...,
        min_length=3,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        example="ESP32_MILITARY_BOX_01",
        description="Unique ESP32 device ID (alphanumeric, hyphens, underscores)"
    )
    temperature: Optional[float] = Field(
        None,
        ge=-50.0,
        le=150.0,
        example=24.5,
        description="Temperature in Celsius (-50°C to +150°C)"
    )
    humidity: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        example=55.0,
        description="Relative Humidity percentage (0% to 100%)"
    )
    vibration_detected: Optional[bool] = Field(
        False,
        description="Vibration/Shock sensor trigger flag"
    )
    door_open: Optional[bool] = Field(
        False,
        description="Magnetic reed switch door state"
    )
    battery_voltage: Optional[float] = Field(
        None,
        ge=0.0,
        le=25.0,
        example=3.95,
        description="Battery voltage level in Volts (0.0V to 25.0V)"
    )
    latitude: Optional[float] = Field(
        None,
        ge=-90.0,
        le=90.0,
        example=28.6139,
        description="GPS Latitude (-90.0 to +90.0)"
    )
    longitude: Optional[float] = Field(
        None,
        ge=-180.0,
        le=180.0,
        example=77.2090,
        description="GPS Longitude (-180.0 to +180.0)"
    )

class DeviceRegisterSchema(BaseModel):
    device_id: str = Field(..., min_length=3, max_length=64)
    name: str = Field("Military Box ESP32", max_length=100)
    location_label: Optional[str] = Field("Depot 1", max_length=100)

class AlertSchema(BaseModel):
    device_id: str
    alert_type: str
    severity: str = "WARNING"
    message: str

# User Authentication Schemas
class UserSignupSchema(BaseModel):
    email: EmailStr = Field(..., example="admin@militarybox.org")
    password: str = Field(..., min_length=8, max_length=128, example="SecureMilitaryPass2026!")

class UserLoginSchema(BaseModel):
    email: EmailStr = Field(..., example="admin@militarybox.org")
    password: str = Field(..., example="SecureMilitaryPass2026!")

class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
