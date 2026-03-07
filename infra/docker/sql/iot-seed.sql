-- Optional IoT sample seed for local development.

INSERT INTO iot_devices (
    id,
    tenant_id,
    name,
    serial_number,
    identifier,
    type,
    location,
    status,
    created_by,
    updated_by
)
SELECT
    'aaaaaaa1-0000-0000-0000-000000000001',
    t.id,
    'Boiler Sensor A',
    'IOT-SN-001',
    'IOT-001',
    'SENSOR',
    'Factory Floor',
    'ONLINE',
    'seed',
    'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM iot_devices d
      WHERE d.tenant_id = t.id
        AND d.identifier = 'IOT-001'
  );

INSERT INTO iot_devices (
    id,
    tenant_id,
    name,
    serial_number,
    identifier,
    type,
    location,
    status,
    created_by,
    updated_by
)
SELECT
    'aaaaaaa1-0000-0000-0000-000000000002',
    t.id,
    'Generator Sensor B',
    'IOT-SN-002',
    'IOT-002',
    'SENSOR',
    'Warehouse',
    'OFFLINE',
    'seed',
    'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM iot_devices d
      WHERE d.tenant_id = t.id
        AND d.identifier = 'IOT-002'
  );

INSERT INTO iot_alarms (
    id,
    tenant_id,
    device_id,
    code,
    severity,
    message,
    status,
    triggered_at,
    acknowledged_at,
    created_by,
    updated_by
)
SELECT
    'bbbbbbb1-0000-0000-0000-000000000001',
    t.id,
    d.id,
    'TEMP_HIGH',
    'HIGH',
    'Temperature exceeded expected threshold',
    'OPEN',
    DATE_SUB(NOW(), INTERVAL 15 MINUTE),
    NULL,
    'seed',
    'seed'
FROM tenants t
JOIN iot_devices d ON d.tenant_id = t.id AND d.identifier = 'IOT-001'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM iot_alarms a
      WHERE a.tenant_id = t.id
        AND a.device_id = d.id
        AND a.code = 'TEMP_HIGH'
  );

INSERT INTO iot_telemetry_records (
    id,
    tenant_id,
    device_id,
    metric_name,
    metric_value,
    unit,
    metadata,
    recorded_at,
    created_by,
    updated_by
)
SELECT
    'ccccccc1-0000-0000-0000-000000000001',
    t.id,
    d.id,
    'temperature',
    82.10,
    'c',
    '{"source":"seed"}',
    DATE_SUB(NOW(), INTERVAL 10 MINUTE),
    'seed',
    'seed'
FROM tenants t
JOIN iot_devices d ON d.tenant_id = t.id AND d.identifier = 'IOT-001'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM iot_telemetry_records r
      WHERE r.tenant_id = t.id
        AND r.device_id = d.id
        AND r.metric_name = 'temperature'
  );
