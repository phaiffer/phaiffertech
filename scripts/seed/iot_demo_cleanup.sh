#!/usr/bin/env bash

set -Eeuo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
TENANT_CODE="${TENANT_CODE:-default}"
EMAIL="${EMAIL:-admin@local.test}"
PASSWORD="${PASSWORD:-Admin@123}"

WORK_DIR="$(mktemp -d)"
ACCESS_TOKEN=""

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

delete_items_by_search() {
  local list_path="$1"
  local delete_base_path="$2"
  local search_term="$3"
  local id_field="$4"
  local label="$5"

  local list_file="${WORK_DIR}/${label}_list.json"
  local list_status

  list_status="$(request "GET" "${list_path}?page=0&size=100&search=${search_term}" "" "${list_file}")"
  assert_success_response "${list_file}" "${list_status}" "${label}_LIST"

  python3 - "${list_file}" "${id_field}" <<'PY'
import json
import sys

file_path = sys.argv[1]
field_name = sys.argv[2]

with open(file_path, "r", encoding="utf-8") as f:
    payload = json.load(f)

items = payload.get("data", {}).get("items", [])
for item in items:
    value = item.get(field_name)
    if value:
        print(value)
PY
}

delete_maintenance_demo_items() {
  local list_file="${WORK_DIR}/maintenance_list.json"
  local list_status

  list_status="$(request "GET" "/iot/maintenance?page=0&size=100&search=demo" "" "${list_file}")"
  assert_success_response "${list_file}" "${list_status}" "MAINTENANCE_LIST"

  python3 - "${list_file}" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    payload = json.load(f)

items = payload.get("data", {}).get("items", [])
for item in items:
    title = (item.get("title") or "").lower()
    description = (item.get("description") or "").lower()
    if "demo" in title or "demo" in description or "cold room" in title or "north plant" in title:
        value = item.get("id")
        if value:
            print(value)
PY
}

require_command curl
require_command python3

log "Starting IoT demo cleanup"
login
log "Authentication succeeded"

log "Deleting demo maintenance tasks"
while IFS= read -r maintenance_id; do
  [[ -z "${maintenance_id}" ]] && continue
  response_file="${WORK_DIR}/maintenance_delete_${maintenance_id}.json"
  status_code="$(request "DELETE" "/iot/maintenance/${maintenance_id}" "" "${response_file}")"
  assert_success_response "${response_file}" "${status_code}" "MAINTENANCE_DELETE_${maintenance_id}"
done < <(delete_maintenance_demo_items)

log "Deleting demo alarms"
while IFS= read -r alarm_id; do
  [[ -z "${alarm_id}" ]] && continue
  response_file="${WORK_DIR}/alarm_delete_${alarm_id}.json"
  status_code="$(request "DELETE" "/iot/alarms/${alarm_id}" "" "${response_file}")"
  assert_success_response "${response_file}" "${status_code}" "ALARM_DELETE_${alarm_id}"
done < <(delete_items_by_search "/iot/alarms" "/iot/alarms" "DEMO" "id" "ALARMS")

log "Deleting demo registers"
while IFS= read -r register_id; do
  [[ -z "${register_id}" ]] && continue
  response_file="${WORK_DIR}/register_delete_${register_id}.json"
  status_code="$(request "DELETE" "/iot/registers/${register_id}" "" "${response_file}")"
  assert_success_response "${response_file}" "${status_code}" "REGISTER_DELETE_${register_id}"
done < <(delete_items_by_search "/iot/registers" "/iot/registers" "DEMO" "id" "REGISTERS")

log "Deleting demo devices"
while IFS= read -r device_id; do
  [[ -z "${device_id}" ]] && continue
  response_file="${WORK_DIR}/device_delete_${device_id}.json"
  status_code="$(request "DELETE" "/iot/devices/${device_id}" "" "${response_file}")"
  assert_success_response "${response_file}" "${status_code}" "DEVICE_DELETE_${device_id}"
done < <(delete_items_by_search "/iot/devices" "/iot/devices" "DEMO" "id" "DEVICES")

cat <<EOF

IoT demo cleanup completed successfully.

Deleted demo data searched by:
- device/register/alarm search term: DEMO
- maintenance content matching demo scenario labels

EOF