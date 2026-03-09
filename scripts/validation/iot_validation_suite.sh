#!/usr/bin/env bash

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/apps/backend"
FRONTEND_DIR="${ROOT_DIR}/apps/frontend"
REPORT_DIR="${ROOT_DIR}/docs/reports"
REPORT_MD="${REPORT_DIR}/iot-system-validation-latest.md"
REPORT_JSON="${REPORT_DIR}/iot-system-validation-latest.json"
WORK_DIR="$(mktemp -d)"
STEPS_FILE="${WORK_DIR}/steps.tsv"

RUN_LIVE_SMOKE="${RUN_LIVE_SMOKE:-false}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
TENANT_CODE="${TENANT_CODE:-default}"
EMAIL="${EMAIL:-admin@local.test}"
PASSWORD="${PASSWORD:-Admin@123}"

STARTED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
OVERALL_STATUS="PASS"

cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

mkdir -p "${REPORT_DIR}"
printf 'name\tstatus\tduration_seconds\tcommand\tnote\n' > "${STEPS_FILE}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

sanitize_field() {
  printf '%s' "$1" | tr '\n\r\t' '   '
}

record_step() {
  local name="$1"
  local status="$2"
  local duration="$3"
  local command="$4"
  local note="$5"

  printf '%s\t%s\t%s\t%s\t%s\n' \
    "$(sanitize_field "${name}")" \
    "$(sanitize_field "${status}")" \
    "$(sanitize_field "${duration}")" \
    "$(sanitize_field "${command}")" \
    "$(sanitize_field "${note}")" \
    >> "${STEPS_FILE}"
}

run_step() {
  local name="$1"
  local command="$2"
  local required="${3:-required}"
  local note="${4:-}"
  local started_epoch ended_epoch duration status exit_code

  log "${name}"
  started_epoch="$(date +%s)"

  if bash -lc "${command}" >"${WORK_DIR}/$(printf '%s' "${name}" | tr '[:upper:] /' '[:lower:]--' | tr -cd 'a-z0-9-').log" 2>&1; then
    status="PASS"
  else
    exit_code=$?
    status="FAIL"
    note="$(sanitize_field "${note}") Exit code: ${exit_code}."
    if [[ "${required}" == "required" ]]; then
      OVERALL_STATUS="FAIL"
    fi
  fi

  ended_epoch="$(date +%s)"
  duration="$((ended_epoch - started_epoch))"
  record_step "${name}" "${status}" "${duration}" "${command}" "${note}"
}

skip_step() {
  local name="$1"
  local command="$2"
  local note="$3"

  log "${name} (skipped)"
  record_step "${name}" "SKIPPED" "0" "${command}" "${note}"
}

generate_reports() {
  local finished_at
  finished_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

  python3 - "${STEPS_FILE}" "${REPORT_MD}" "${REPORT_JSON}" "${STARTED_AT}" "${finished_at}" "${OVERALL_STATUS}" "${RUN_LIVE_SMOKE}" <<'PY'
import csv
import json
import sys
from pathlib import Path

steps_file, report_md, report_json, started_at, finished_at, overall_status, live_smoke_mode = sys.argv[1:]

with open(steps_file, "r", encoding="utf-8") as handle:
    reader = csv.DictReader(handle, delimiter="\t")
    steps = list(reader)

failures = [step for step in steps if step["status"] == "FAIL"]
skipped = [step for step in steps if step["status"] == "SKIPPED"]

commands = [step["command"] for step in steps]
backend_tests = [
    "IotIntegrationTest",
    "IotTelemetryIntegrationTest",
    "IotRegistersMaintenanceIntegrationTest",
    "IotDashboardReportsIntegrationTest",
    "IotDemoScenarioIntegrationTest",
]
frontend_tests = [
    "apps/frontend/src/modules/iot/iot-utils.test.ts",
    "apps/frontend/src/shared/lib/http.test.ts",
    "apps/frontend/src/shared/lib/session.test.ts",
    "apps/frontend/src/shared/components/auth-provider.test.tsx",
    "apps/frontend/src/app/(public)/login/page.test.tsx",
    "apps/frontend/src/app/(app)/tenants/page.test.tsx",
    "apps/frontend/src/app/(app)/users/page.test.tsx",
]

if overall_status == "FAIL":
    conclusion = "IoT System is not ready for demo because at least one mandatory validation step failed."
elif skipped:
    conclusion = "IoT System passed code-level demo validation. Optional live API smoke was not executed in this run."
else:
    conclusion = "IoT System passed the automated validation suite and is ready for demo at the current code baseline."

payload = {
    "executedAt": started_at,
    "finishedAt": finished_at,
    "finalStatus": overall_status,
    "commands": commands,
    "steps": steps,
    "backendTests": backend_tests,
    "frontendTests": frontend_tests,
    "failures": failures,
    "skipped": skipped,
    "limitations": [
        "Frontend IoT coverage remains lightweight and focused on smoke-level helper validation plus global frontend tests.",
        "Live API smoke is optional and only runs when RUN_LIVE_SMOKE=true with an accessible backend environment.",
        "The suite validates IoT readiness pragmatically; it does not create a full browser E2E framework."
    ],
    "conclusion": conclusion,
    "liveSmokeMode": live_smoke_mode,
}

md_lines = [
    "# IoT System Validation Report",
    "",
    f"- Execution started: `{started_at}`",
    f"- Execution finished: `{finished_at}`",
    f"- Final status: `{overall_status}`",
    f"- Live API smoke mode: `{live_smoke_mode}`",
    "",
    "## Commands executed",
]
md_lines.extend([f"- `{command}`" for command in commands])
md_lines.extend([
    "",
    "## Results by step",
])

for step in steps:
    md_lines.extend([
        f"### {step['name']}",
        f"- Status: `{step['status']}`",
        f"- Duration: `{step['duration_seconds']}s`",
        f"- Command: `{step['command']}`",
    ])
    if step["note"]:
        md_lines.append(f"- Notes: {step['note']}")
    md_lines.append("")

md_lines.extend([
    "## Tests executed",
    "- Backend IoT integration tests:",
])
md_lines.extend([f"  - `{name}`" for name in backend_tests])
md_lines.append("- Frontend tests executed via `npm run test`, including:")
md_lines.extend([f"  - `{name}`" for name in frontend_tests])
md_lines.extend([
    "",
    "## Failures found",
])

if failures:
    md_lines.extend([f"- `{step['name']}` failed. {step['note'] or 'See command output for details.'}" for step in failures])
else:
    md_lines.append("- No mandatory failures were detected.")

md_lines.extend([
    "",
    "## Pending or skipped checks",
])

if skipped:
    md_lines.extend([f"- `{step['name']}` skipped. {step['note']}" for step in skipped])
else:
    md_lines.append("- No steps were skipped.")

md_lines.extend([
    "",
    "## Limitations known",
])
md_lines.extend([f"- {item}" for item in payload["limitations"]])
md_lines.extend([
    "",
    "## Demo readiness conclusion",
    f"- {conclusion}",
])

Path(report_md).write_text("\n".join(md_lines) + "\n", encoding="utf-8")
Path(report_json).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY
}

run_step \
  "Frontend lint" \
  "cd \"${FRONTEND_DIR}\" && npm run lint" \
  "required" \
  "Validates Next.js lint for the frontend used by the IoT module."

run_step \
  "Frontend tests" \
  "cd \"${FRONTEND_DIR}\" && npm run test" \
  "required" \
  "Runs Vitest, including the IoT smoke helper test and the existing frontend suite."

run_step \
  "Frontend build" \
  "cd \"${FRONTEND_DIR}\" && npm run build" \
  "required" \
  "Confirms IoT routes compile inside the production frontend build."

run_step \
  "Backend IoT integration suite" \
  "cd \"${BACKEND_DIR}\" && mvn -Dtest=IotIntegrationTest,IotTelemetryIntegrationTest,IotRegistersMaintenanceIntegrationTest,IotDashboardReportsIntegrationTest,IotDemoScenarioIntegrationTest test" \
  "required" \
  "Covers devices, registers, telemetry, alarms, maintenance, dashboard, reports and demo generator flow."

if [[ "${RUN_LIVE_SMOKE}" == "true" ]]; then
  run_step \
    "Live IoT API smoke" \
    "cd \"${ROOT_DIR}\" && API_BASE_URL=\"${API_BASE_URL}\" TENANT_CODE=\"${TENANT_CODE}\" EMAIL=\"${EMAIL}\" PASSWORD=\"${PASSWORD}\" ./scripts/validation/iot_operational_validation.sh" \
    "required" \
    "Runs the live IoT API validation flow against an already running backend environment."
else
  skip_step \
    "Live IoT API smoke" \
    "cd \"${ROOT_DIR}\" && API_BASE_URL=\"${API_BASE_URL}\" TENANT_CODE=\"${TENANT_CODE}\" EMAIL=\"${EMAIL}\" PASSWORD=\"${PASSWORD}\" ./scripts/validation/iot_operational_validation.sh" \
    "Skipped by default. Set RUN_LIVE_SMOKE=true to validate a running backend stack via HTTP."
fi

generate_reports

log "Validation report generated at ${REPORT_MD}"
log "Machine-readable report generated at ${REPORT_JSON}"

if [[ "${OVERALL_STATUS}" == "FAIL" ]]; then
  exit 1
fi

exit 0
