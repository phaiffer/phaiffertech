#!/usr/bin/env bash

set -Eeuo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
TENANT_CODE="${TENANT_CODE:-default}"
EMAIL="${EMAIL:-admin@local.test}"
PASSWORD="${PASSWORD:-Admin@123}"

WORK_DIR="$(mktemp -d)"
ACCESS_TOKEN=""
DEVICE_ID=""
REGISTER_ID=""
ALARM_ID=""
MAINTENANCE_ID=""

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

print_response_summary() {
  local file="$1"
  local label="$2"

  printf '\n[%s] Response:\n' "${label}"
  python3 - "${file}" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

print(json.dumps(data, indent=2, ensure_ascii=False))
PY
}

require_command curl
require_command python3

log "IoT operational validation started"
log "API base URL: ${API_BASE_URL}"

LOGIN_RESPONSE="${WORK_DIR}/login.json"
LOGIN_STATUS="$(
  request "POST" "/auth/login" \
    "$(cat <<JSON
{
  "tenantCode": "${TENANT_CODE}",
  "email": "${EMAIL}",
  "password": "${PASSWORD}"
}
JSON
)" \
    "${LOGIN_RESPONSE}"
)"
assert_success_response "${LOGIN_RESPONSE}" "${LOGIN_STATUS}" "LOGIN"

ACCESS_TOKEN="$(extract_json "${LOGIN_RESPONSE}" "data.accessToken")"
[[ -n "${ACCESS_TOKEN}" ]] || fail "Access token not found in login response"

log "Login succeeded"

ME_RESPONSE="${WORK_DIR}/me.json"
ME_STATUS="$(request "GET" "/auth/me" "" "${ME_RESPONSE}")"
assert_success_response "${ME_RESPONSE}" "${ME_STATUS}" "ME"

MODULES_RESPONSE="${WORK_DIR}/modules.json"
MODULES_STATUS="$(request "GET" "/modules" "" "${MODULES_RESPONSE}")"
assert_success_response "${MODULES_RESPONSE}" "${MODULES_STATUS}" "MODULES"

log "Core auth and module access validated"

DEVICE_RESPONSE="${WORK_DIR}/device_create.json"
DEVICE_STATUS="$(
  request "POST" "/iot/devices" \
    "$(cat <<JSON
{
  "name": "Validation Device",
  "identifier": "VAL-DEVICE-001",
  "type": "GATEWAY",
  "location": "Validation Lab",
  "description": "Device created by IoT operational validation",
  "status": "ACTIVE"
}
JSON
)" \
    "${DEVICE_RESPONSE}"
)"
assert_success_response "${DEVICE_RESPONSE}" "${DEVICE_STATUS}" "DEVICE_CREATE"

DEVICE_ID="$(extract_json "${DEVICE_RESPONSE}" "data.id")"
[[ -n "${DEVICE_ID}" ]] || fail "Device id not found"

log "Device created: ${DEVICE_ID}"

DEVICE_LIST_RESPONSE="${WORK_DIR}/device_list.json"
DEVICE_LIST_STATUS="$(request "GET" "/iot/devices?page=0&size=10&search=Validation" "" "${DEVICE_LIST_RESPONSE}")"
assert_success_response "${DEVICE_LIST_RESPONSE}" "${DEVICE_LIST_STATUS}" "DEVICE_LIST"

REGISTER_RESPONSE="${WORK_DIR}/register_create.json"
REGISTER_STATUS="$(
  request "POST" "/iot/registers" \
    "$(cat <<JSON
{
  "deviceId": "${DEVICE_ID}",
  "name": "Temperature Register",
  "code": "TEMP_MAIN",
  "metricName": "temperature",
  "unit": "C",
  "dataType": "DECIMAL",
  "minThreshold": 0,
  "maxThreshold": 80,
  "status": "ACTIVE"
}
JSON
)" \
    "${REGISTER_RESPONSE}"
)"
assert_success_response "${REGISTER_RESPONSE}" "${REGISTER_STATUS}" "REGISTER_CREATE"

REGISTER_ID="$(extract_json "${REGISTER_RESPONSE}" "data.id")"
[[ -n "${REGISTER_ID}" ]] || fail "Register id not found"

log "Register created: ${REGISTER_ID}"

REGISTER_LIST_RESPONSE="${WORK_DIR}/register_list.json"
REGISTER_LIST_STATUS="$(request "GET" "/iot/registers?page=0&size=10&device_id=${DEVICE_ID}" "" "${REGISTER_LIST_RESPONSE}")"
assert_success_response "${REGISTER_LIST_RESPONSE}" "${REGISTER_LIST_STATUS}" "REGISTER_LIST"

TELEMETRY_WRITE_RESPONSE="${WORK_DIR}/telemetry_write.json"
TELEMETRY_WRITE_STATUS="$(
  request "POST" "/iot/telemetry" \
    "$(cat <<JSON
{
  "deviceId": "${DEVICE_ID}",
  "registerId": "${REGISTER_ID}",
  "metricName": "temperature",
  "metricValue": 92.5,
  "unit": "C",
  "metadata": {
    "source": "iot_operational_validation"
  },
  "recordedAt": "2026-03-07T12:00:00Z"
}
JSON
)" \
    "${TELEMETRY_WRITE_RESPONSE}"
)"
assert_success_response "${TELEMETRY_WRITE_RESPONSE}" "${TELEMETRY_WRITE_STATUS}" "TELEMETRY_WRITE"

TELEMETRY_LIST_RESPONSE="${WORK_DIR}/telemetry_list.json"
TELEMETRY_LIST_STATUS="$(
  request "GET" "/iot/telemetry?page=0&size=10&device_id=${DEVICE_ID}&register_id=${REGISTER_ID}&metric_name=temperature&start_at=2026-03-07T00:00:00Z&end_at=2026-03-08T00:00:00Z" \
    "" \
    "${TELEMETRY_LIST_RESPONSE}"
)"
assert_success_response "${TELEMETRY_LIST_RESPONSE}" "${TELEMETRY_LIST_STATUS}" "TELEMETRY_LIST"

ALARM_RESPONSE="${WORK_DIR}/alarm_create.json"
ALARM_STATUS="$(
  request "POST" "/iot/alarms" \
    "$(cat <<JSON
{
  "deviceId": "${DEVICE_ID}",
  "registerId": "${REGISTER_ID}",
  "code": "TEMP_HIGH",
  "message": "Temperature threshold exceeded during validation",
  "severity": "HIGH",
  "status": "OPEN",
  "triggeredAt": "2026-03-07T12:01:00Z"
}
JSON
)" \
    "${ALARM_RESPONSE}"
)"
assert_success_response "${ALARM_RESPONSE}" "${ALARM_STATUS}" "ALARM_CREATE"

ALARM_ID="$(extract_json "${ALARM_RESPONSE}" "data.id")"
[[ -n "${ALARM_ID}" ]] || fail "Alarm id not found"

log "Alarm created: ${ALARM_ID}"

ALARM_ACK_RESPONSE="${WORK_DIR}/alarm_ack.json"
ALARM_ACK_STATUS="$(request "POST" "/iot/alarms/${ALARM_ID}/acknowledge" "" "${ALARM_ACK_RESPONSE}")"
assert_success_response "${ALARM_ACK_RESPONSE}" "${ALARM_ACK_STATUS}" "ALARM_ACK"

MAINTENANCE_RESPONSE="${WORK_DIR}/maintenance_create.json"
MAINTENANCE_STATUS="$(
  request "POST" "/iot/maintenance" \
    "$(cat <<JSON
{
  "deviceId": "${DEVICE_ID}",
  "title": "Inspect overheating sensor",
  "description": "Maintenance task created by IoT operational validation",
  "status": "OPEN",
  "priority": "HIGH",
  "scheduledAt": "2026-03-08T09:00:00Z"
}
JSON
)" \
    "${MAINTENANCE_RESPONSE}"
)"
assert_success_response "${MAINTENANCE_RESPONSE}" "${MAINTENANCE_STATUS}" "MAINTENANCE_CREATE"

MAINTENANCE_ID="$(extract_json "${MAINTENANCE_RESPONSE}" "data.id")"
[[ -n "${MAINTENANCE_ID}" ]] || fail "Maintenance id not found"

log "Maintenance created: ${MAINTENANCE_ID}"

DASHBOARD_RESPONSE="${WORK_DIR}/dashboard_summary.json"
DASHBOARD_STATUS="$(request "GET" "/iot/dashboard/summary" "" "${DASHBOARD_RESPONSE}")"
assert_success_response "${DASHBOARD_RESPONSE}" "${DASHBOARD_STATUS}" "DASHBOARD_SUMMARY"

REPORTS_RESPONSE="${WORK_DIR}/reports_summary.json"
REPORTS_STATUS="$(request "GET" "/iot/reports/summary" "" "${REPORTS_RESPONSE}")"
assert_success_response "${REPORTS_RESPONSE}" "${REPORTS_STATUS}" "REPORTS_SUMMARY"

log "IoT operational validation finished successfully"

print_response_summary "${ME_RESPONSE}" "AUTH /me"
print_response_summary "${DEVICE_RESPONSE}" "DEVICE CREATE"
print_response_summary "${REGISTER_RESPONSE}" "REGISTER CREATE"
print_response_summary "${TELEMETRY_LIST_RESPONSE}" "TELEMETRY LIST"
print_response_summary "${ALARM_ACK_RESPONSE}" "ALARM ACK"
print_response_summary "${MAINTENANCE_RESPONSE}" "MAINTENANCE CREATE"
print_response_summary "${DASHBOARD_RESPONSE}" "DASHBOARD SUMMARY"
print_response_summary "${REPORTS_RESPONSE}" "REPORTS SUMMARY"

cat <<EOF

Validation checklist completed successfully.

Created resources:
- Device: ${DEVICE_ID}
- Register: ${REGISTER_ID}
- Alarm: ${ALARM_ID}
- Maintenance: ${MAINTENANCE_ID}

Validated flows:
- Auth login
- Auth me
- Module access
- Device create/list
- Register create/list
- Telemetry write/read
- Alarm create/acknowledge
- Maintenance create
- IoT dashboard summary
- IoT reports summary

EOF