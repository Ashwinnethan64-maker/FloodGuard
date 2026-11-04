import pytest
from app.services.demo_service import demo_engine
from app.services.iot_service import iot_telemetry_registry, IoTTelemetryPayload, SensorType

def test_demonstration_scenario_lifecycle():
    # 1. Reset
    reset_res = demo_engine.reset_demo()
    assert reset_res["status"] == "reset"
    status = demo_engine.get_status()
    assert status.is_active is False
    assert status.current_step == 0

    # 2. Step 1: Heavy rain
    step1 = demo_engine.trigger_step_1_heavy_rain()
    assert step1["step"] == 1
    assert step1["status"] == "executed"
    assert demo_engine.get_status().current_step == 1

    # 3. Step 2: Citizen report
    step2 = demo_engine.trigger_step_2_citizen_report()
    assert step2["step"] == 2
    assert "inc-" in step2["incident_id"]

    # 4. Step 3: Admin verify
    step3 = demo_engine.trigger_step_3_admin_verify()
    assert step3["step"] == 3
    assert step3["verified_incident"].verification_status == "VERIFIED"

    # 5. Step 4: Route calculation bypass
    step4 = demo_engine.trigger_step_4_recalculate_routes()
    assert step4["step"] == 4
    assert step4["recommended_route"].is_viable is True
    assert "Kadri" in step4["recommended_route"].label or "Flood-Avoidant" in step4["recommended_route"].label

def test_iot_telemetry_ingestion():
    devices = iot_telemetry_registry.get_registered_devices()
    assert len(devices) >= 3
    
    # Ingest mock telemetry reading
    payload = IoTTelemetryPayload(
        device_id="esp32-node-kottara",
        sensor_type=SensorType.ULTRASONIC_WATER_LEVEL,
        measured_water_depth_cm=58.5,
        battery_voltage=3.95,
        rssi_dbm=-62
    )
    res = iot_telemetry_registry.ingest_telemetry(payload)
    assert res["status"] == "ingested"
    assert res["device_id"] == "esp32-node-kottara"

