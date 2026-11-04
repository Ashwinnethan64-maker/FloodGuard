"""
NEERPATH IoT Integration Interface Specification & Telemetry Ingestion.
Supports:
- ESP32 microcontrollers
- Ultrasonic water level sensors (e.g., JSN-SR04T waterproof)
- Tipping-bucket digital rain gauges
- MQTT & HTTP REST JSON telemetry ingestion
- Hardware is optional: Software runs autonomously with simulated/Open-Meteo feeds.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from enum import Enum
import uuid

class SensorType(str, Enum):
    ULTRASONIC_WATER_LEVEL = "ULTRASONIC_WATER_LEVEL"
    DIGITAL_RAIN_GAUGE = "DIGITAL_RAIN_GAUGE"
    ROAD_SURFACE_MOISTURE = "ROAD_SURFACE_MOISTURE"
    CULVERT_FLOW_METER = "CULVERT_FLOW_METER"

class SensorHealthStatus(str, Enum):
    ONLINE = "ONLINE"
    BATTERY_LOW = "BATTERY_LOW"
    OFFLINE = "OFFLINE"
    CALIBRATION_REQUIRED = "CALIBRATION_REQUIRED"

class IoTDeviceRegistration(BaseModel):
    device_id: str
    device_name: str
    sensor_type: SensorType
    corridor_id: str
    ward: str
    latitude: float
    longitude: float
    firmware_version: str = "esp32-neerpath-v1.2"
    battery_percentage: float = Field(100.0, ge=0.0, le=100.0)
    status: SensorHealthStatus = SensorHealthStatus.ONLINE
    last_heartbeat: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IoTTelemetryPayload(BaseModel):
    device_id: str
    sensor_type: SensorType
    measured_water_depth_cm: Optional[float] = None
    rainfall_rate_last_10m_mm: Optional[float] = None
    battery_voltage: float = 3.7
    rssi_dbm: int = -65
    raw_reading_metadata: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IoTTelemetryRegistry:
    def __init__(self):
        # Pre-configured simulated IoT nodes stationed at Mangaluru culverts
        self._devices: Dict[str, IoTDeviceRegistration] = {
            "esp32-node-kottara": IoTDeviceRegistration(
                device_id="esp32-node-kottara",
                device_name="Kottara Culvert Ultrasonic Unit 01",
                sensor_type=SensorType.ULTRASONIC_WATER_LEVEL,
                corridor_id="corridor-kottara-chowki",
                ward="Kottara / Derebail (Ward 17)",
                latitude=12.9050,
                longitude=74.8445,
                firmware_version="esp32-neerpath-v1.4",
                battery_percentage=94.0,
                status=SensorHealthStatus.ONLINE,
                last_heartbeat=datetime.now(timezone.utc)
            ),
            "esp32-node-pumpwell": IoTDeviceRegistration(
                device_id="esp32-node-pumpwell",
                device_name="Mahaveera Junction Storm Drain Node 02",
                sensor_type=SensorType.ULTRASONIC_WATER_LEVEL,
                corridor_id="corridor-pumpwell-circle",
                ward="Kankanady (Ward 48)",
                latitude=12.8625,
                longitude=74.8695,
                firmware_version="esp32-neerpath-v1.4",
                battery_percentage=88.5,
                status=SensorHealthStatus.ONLINE,
                last_heartbeat=datetime.now(timezone.utc)
            ),
            "esp32-gauge-kadri": IoTDeviceRegistration(
                device_id="esp32-gauge-kadri",
                device_name="Kadri Hilltop Digital Rain Gauge",
                sensor_type=SensorType.DIGITAL_RAIN_GAUGE,
                corridor_id="corridor-kadri-temple-road",
                ward="Kadri (Ward 33)",
                latitude=12.8870,
                longitude=74.8630,
                firmware_version="esp32-neerpath-v1.4",
                battery_percentage=98.0,
                status=SensorHealthStatus.ONLINE,
                last_heartbeat=datetime.now(timezone.utc)
            )
        }
        self._telemetry_log: List[IoTTelemetryPayload] = []

    def get_registered_devices(self) -> List[IoTDeviceRegistration]:
        return list(self._devices.values())

    def ingest_telemetry(self, payload: IoTTelemetryPayload) -> Dict[str, Any]:
        self._telemetry_log.append(payload)
        if payload.device_id in self._devices:
            dev = self._devices[payload.device_id]
            dev.last_heartbeat = payload.timestamp
            dev.battery_percentage = max(0.0, min(100.0, (payload.battery_voltage - 3.2) / (4.2 - 3.2) * 100))

        return {
            "status": "ingested",
            "device_id": payload.device_id,
            "sensor_type": payload.sensor_type,
            "recorded_at": payload.timestamp.isoformat(),
            "message": "Telemetry queued for spatial road-condition reconciliation"
        }

iot_telemetry_registry = IoTTelemetryRegistry()

