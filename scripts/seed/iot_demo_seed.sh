#!/usr/bin/env bash

set -Eeuo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
TENANT_CODE="${TENANT_CODE:-default}"
EMAIL="${EMAIL:-admin@local.test}"
PASSWORD="${PASSWORD:-Admin@123}"

WORK_DIR="$(mktemp -d)"
ACCESS_TOKEN=""

declare -a DEVICE_IDS=()
declare -a REGISTER_IDS=()
declare -a ALARM_IDS=()
declare -a MAINTENANCE_IDS=()

cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

fail() {
  printf '\n[ERROR] %s\n' "$1" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command not found: $1"
  fi
}

extract_json() {
  local file="$1"
  local expression="$2"

  python3 - "$file" "$expression" <<'PY'
import json
import sys

file_path = sys.argv[1]
expression = sys.argv[2]

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

current = data
for part in expression.split("."):
    if not part:
        continue
    if "[" in part and part.endswith("]"):
        name, index_part = part[:-1].split("[", 1)
        if name:
            current = current.get(name)
        current = current[int(index_part)]
    else:
        if isinstance(current, dict):
            current = current.get(part)
        else:
            current = None
    if current is None:
        break

if current is None:
    print("")
elif isinstance(current, (dict, list)):
    print(json.dumps(current))
else:
    print(str(current))
PY
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local output_file="$4"

  local status_code
  local headers=(
    -H "Content-Type: application/json"
  )

  if [[ -n "${ACCESS_TOKEN}" ]]; then
    headers+=(-H "Authorization: Bearer ${ACCESS_TOKEN}")
  fi

  if [[ -n "${body}" ]]; then
    status_code=$(
      curl -sS \
        -o "${output_file}" \
        -w "%{http_code}" \
        -X "${method}" \
        "${headers[@]}" \
        --data "${body}" \
        "${API_BASE_URL}${path}"
    )
  else
    status_code=$(
      curl -sS \
        -o "${output_file}" \
        -w "%{http_code}" \
        -X "${method}" \
        "${headers[@]}" \
        "${API_BASE_URL}${path}"
    )
  fi

  printf '%s' "${status_code}"
}

assert_success_response() {
  local file="$1"
  local status_code="$2"
  local label="$3"

  if [[ "${status_code}" -lt 200 || "${status_code}" -ge 300 ]]; then
    printf '\n[%s] Unexpected HTTP status: %s\n' "${label}" "${status_code}" >&2
    cat "${file}" >&2
    exit 1
  fi

  local success
  success="$(extract_json "${file}" "success")"

  if [[ "${success}" != "True" && "${success}" != "true" ]]; then
    printf '\n[%s] API did not return success=true\n' "${label}" >&2
    cat "${file}" >&2
    exit 1
  fi
}

login() {
  local response_file="${WORK_DIR}/login.json"
  local status_code

  status_code="$(
    request "POST" "/auth/login" \
      "$(cat <<JSON
{
  "tenantCode": "${TENANT_CODE}",
  "email": "${EMAIL}",
  "password": "${PASSWORD}"
}
JSON
)" \
      "${response_file}"
  )"

  assert_success_response "${response_file}" "${status_code}" "LOGIN"

  ACCESS_TOKEN="$(extract_json "${response_file}" "data.accessToken")"
  [[ -n "${ACCESS_TOKEN}" ]] || fail "Access token not found"
}

create_device() {
  local name="$1"
  local identifier="$2"
  local type="$3"
  local location="$4"
  local description="$5"

  local response_file="${WORK_DIR}/device_${identifier}.json"
  local status_code
  local device_id

  status_code="$(
    request "POST" "/iot/devices" \
      "$(cat <<JSON
{
  "name": "${name}",
  "identifier": "${identifier}",
  "type": "${type}",
  "location": "${location}",
  "description": "${description}",
  "status": "ACTIVE"
}
JSON
)" \
      "${response_file}"
  )"

  assert_success_response "${response_file}" "${status_code}" "CREATE_DEVICE_${identifier}"

  device_id="$(extract_json "${response_file}" "data.id")"
  [[ -n "${device_id}" ]] || fail "Device id not found for ${identifier}"

  DEVICE_IDS+=("${device_id}")
  printf '%s' "${device_id}"
}

create_register() {
  local device_id="$1"
  local name="$2"
  local code="$3"
  local metric_name="$4"
  local unit="$5"
  local data_type="$6"
  local min_threshold="$7"
  local max_threshold="$8"

  local response_file="${WORK_DIR}/register_${code}.json"
  local status_code
  local register_id

  status_code="$(
    request "POST" "/iot/registers" \
      "$(cat <<JSON
{
  "deviceId": "${device_id}",
  "name": "${name}",
  "code": "${code}",
  "metricName": "${metric_name}",
  "unit": "${unit}",
  "dataType": "${data_type}",
  "minThreshold": ${min_threshold},
  "maxThreshold": ${max_threshold},
  "status": "ACTIVE"
}
JSON
)" \
      "${response_file}"
  )"

  assert_success_response "${response_file}" "${status_code}" "CREATE_REGISTER_${code}"

  register_id="$(extract_json "${response_file}" "data.id")"
  [[ -n "${register_id}" ]] || fail "Register id not found for ${code}"

  REGISTER_IDS+=("${register_id}")
  printf '%s' "${register_id}"
}

write_telemetry() {
  local device_id="$1"
  local register_id="$2"
  local metric_name="$3"
  local metric_value="$4"
  local unit="$5"
  local recorded_at="$6"
  local source_label="$7"

  local safe_name
  safe_name="$(printf '%s' "${metric_name}_${source_label}" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_' '_')"

  local response_file="${WORK_DIR}/telemetry_${safe_name}.json"
  local status_code

  status_code="$(
    request "POST" "/iot/telemetry" \
      "$(cat <<JSON
{
  "deviceId": "${device_id}",
  "registerId": "${register_id}",
  "metricName": "${metric_name}",
  "metricValue": ${metric_value},
  "unit": "${unit}",
  "metadata": {
    "source": "${source_label}"
  },
  "recordedAt": "${recorded_at}"
}
JSON
)" \
      "${response_file}"
  )"

  assert_success_response "${response_file}" "${status_code}" "WRITE_TELEMETRY_${safe_name}"
}

create_alarm() {
  local device_id="$1"
  local register_id="$2"
  local code="$3"
  local message="$4"
  local severity="$5"
  local triggered_at="$6"

  local response_file="${WORK_DIR}/alarm_${code}.json"
  local status_code
  local alarm_id

  status_code="$(
    request "POST" "/iot/alarms" \
      "$(cat <<JSON
{
  "deviceId": "${device_id}",
  "registerId": "${register_id}",
  "code": "${code}",
  "message": "${message}",
  "severity": "${severity}",
  "status": "OPEN",
  "triggeredAt": "${triggered_at}"
}
JSON
)" \
      "${response_file}"
  )"

  assert_success_response "${response_file}" "${status_code}" "CREATE_ALARM_${code}"

  alarm_id="$(extract_json "${response_file}" "data.id")"
  [[ -n "${alarm_id}" ]] || fail "Alarm id not found for ${code}"

  ALARM_IDS+=("${alarm_id}")
  printf '%s' "${alarm_id}"
}

ack_alarm() {
  local alarm_id="$1"
  local response_file="${WORK_DIR}/alarm_ack_${alarm_id}.json"
  local status_code

  status_code="$(request "POST" "/iot/alarms/${alarm_id}/acknowledge" "" "${response_file}")"
  assert_success_response "${response_file}" "${status_code}" "ACK_ALARM_${alarm_id}"
}

create_maintenance() {
  local device_id="$1"
  local title="$2"
  local description="$3"
  local priority="$4"
  local scheduled_at="$5"

  local safe_name
  safe_name="$(printf '%s' "${title}" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_' '_')"

  local response_file="${WORK_DIR}/maintenance_${safe_name}.json"
  local status_code
  local maintenance_id

  status_code="$(
    request "POST" "/iot/maintenance" \
      "$(cat <<JSON
{
  "deviceId": "${device_id}",
  "title": "${title}",
  "description": "${description}",
  "status": "OPEN",
  "priority": "${priority}",
  "scheduledAt": "${scheduled_at}"
}
JSON
)" \
      "${response_file}"
  )"

  assert_success_response "${response_file}" "${status_code}" "CREATE_MAINTENANCE_${safe_name}"

  maintenance_id="$(extract_json "${response_file}" "data.id")"
  [[ -n "${maintenance_id}" ]] || fail "Maintenance id not found for ${title}"

  MAINTENANCE_IDS+=("${maintenance_id}")
  printf '%s' "${maintenance_id}"
}

require_command curl
require_command python3

log "Starting IoT demo seed"
login
log "Authentication succeeded"

log "Creating demo devices"
EDGE_NORTH_ID="$(create_device "North Plant Edge Gateway" "DEMO-EDGE-NORTH-001" "GATEWAY" "North Plant" "Primary gateway for the north plant demo scenario")"
HVAC_CTRL_ID="$(create_device "HVAC Controller A" "DEMO-HVAC-A-001" "CONTROLLER" "Building A" "Environmental control unit for the main building")"
COLD_CHAIN_ID="$(create_device "Cold Chain Monitor" "DEMO-COLD-001" "SENSOR_NODE" "Warehouse Cold Room" "Cold storage monitoring node for refrigerated inventory")"

log "Creating registers"
EDGE_TEMP_ID="$(create_register "${EDGE_NORTH_ID}" "North Temperature" "NORTH_TEMP" "temperature" "c" "DECIMAL" 0 80)"
EDGE_VIB_ID="$(create_register "${EDGE_NORTH_ID}" "North Vibration" "NORTH_VIB" "vibration" "mm_s" "DECIMAL" 0 12)"
HVAC_TEMP_ID="$(create_register "${HVAC_CTRL_ID}" "HVAC Supply Temperature" "HVAC_TEMP" "temperature" "c" "DECIMAL" 16 26)"
HVAC_HUM_ID="$(create_register "${HVAC_CTRL_ID}" "HVAC Humidity" "HVAC_HUM" "humidity" "%" "DECIMAL" 30 65)"
COLD_TEMP_ID="$(create_register "${COLD_CHAIN_ID}" "Cold Room Temperature" "COLD_TEMP" "temperature" "c" "DECIMAL" -5 8)"
COLD_DOOR_ID="$(create_register "${COLD_CHAIN_ID}" "Door Open Time" "COLD_DOOR" "door_open_seconds" "s" "DECIMAL" 0 45)"

log "Writing telemetry"
write_telemetry "${EDGE_NORTH_ID}" "${EDGE_TEMP_ID}" "temperature" 74.2 "c" "2026-03-07T08:00:00Z" "demo_seed"
write_telemetry "${EDGE_NORTH_ID}" "${EDGE_TEMP_ID}" "temperature" 88.9 "c" "2026-03-07T09:15:00Z" "demo_seed"
write_telemetry "${EDGE_NORTH_ID}" "${EDGE_VIB_ID}" "vibration" 11.2 "mm_s" "2026-03-07T09:16:00Z" "demo_seed"

write_telemetry "${HVAC_CTRL_ID}" "${HVAC_TEMP_ID}" "temperature" 22.3 "c" "2026-03-07T08:20:00Z" "demo_seed"
write_telemetry "${HVAC_CTRL_ID}" "${HVAC_HUM_ID}" "humidity" 48.5 "%" "2026-03-07T08:21:00Z" "demo_seed"

write_telemetry "${COLD_CHAIN_ID}" "${COLD_TEMP_ID}" "temperature" 3.8 "c" "2026-03-07T07:55:00Z" "demo_seed"
write_telemetry "${COLD_CHAIN_ID}" "${COLD_TEMP_ID}" "temperature" 10.9 "c" "2026-03-07T10:02:00Z" "demo_seed"
write_telemetry "${COLD_CHAIN_ID}" "${COLD_DOOR_ID}" "door_open_seconds" 61 "s" "2026-03-07T10:03:00Z" "demo_seed"

log "Creating alarms"
EDGE_ALARM_ID="$(create_alarm "${EDGE_NORTH_ID}" "${EDGE_TEMP_ID}" "NORTH_TEMP_HIGH" "North plant temperature exceeded threshold during demo seed" "HIGH" "2026-03-07T09:15:00Z")"
COLD_ALARM_ID="$(create_alarm "${COLD_CHAIN_ID}" "${COLD_TEMP_ID}" "COLD_ROOM_TEMP_BREACH" "Cold room exceeded safe temperature threshold during demo seed" "CRITICAL" "2026-03-07T10:02:00Z")"
DOOR_ALARM_ID="$(create_alarm "${COLD_CHAIN_ID}" "${COLD_DOOR_ID}" "COLD_ROOM_DOOR_OPEN" "Cold room door remained open longer than expected during demo seed" "MEDIUM" "2026-03-07T10:03:00Z")"

ack_alarm "${DOOR_ALARM_ID}"

log "Creating maintenance tasks"
create_maintenance "${EDGE_NORTH_ID}" "Inspect north plant cooling fan" "Open a maintenance order for the north plant cooling fan after overheating event" "HIGH" "2026-03-08T09:00:00Z"
create_maintenance "${COLD_CHAIN_ID}" "Check cold room door seal" "Review door seal after repeated prolonged open-door events" "MEDIUM" "2026-03-08T11:00:00Z"

cat <<EOF

IoT demo seed completed successfully.

Created devices:
- ${EDGE_NORTH_ID} | North Plant Edge Gateway
- ${HVAC_CTRL_ID} | HVAC Controller A
- ${COLD_CHAIN_ID} | Cold Chain Monitor

Created registers:
- ${EDGE_TEMP_ID} | NORTH_TEMP
- ${EDGE_VIB_ID} | NORTH_VIB
- ${HVAC_TEMP_ID} | HVAC_TEMP
- ${HVAC_HUM_ID} | HVAC_HUM
- ${COLD_TEMP_ID} | COLD_TEMP
- ${COLD_DOOR_ID} | COLD_DOOR

Created alarms:
- ${EDGE_ALARM_ID} | NORTH_TEMP_HIGH
- ${COLD_ALARM_ID} | COLD_ROOM_TEMP_BREACH
- ${DOOR_ALARM_ID} | COLD_ROOM_DOOR_OPEN (acknowledged)

Created maintenance tasks:
- ${MAINTENANCE_IDS[0]}
- ${MAINTENANCE_IDS[1]}

Suggested demo flow:
1. Open /iot/dashboard
2. Open /iot/devices
3. Open /iot/registers
4. Open /iot/telemetry
5. Open /iot/alarms
6. Open /iot/maintenance
7. Open /iot/reports

EOF