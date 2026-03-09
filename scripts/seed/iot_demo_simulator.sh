#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/apps/backend"
MODE="${1:-${APP_IOT_DEMO_MODE:-demo}}"

case "${MODE}" in
  demo|test)
    ;;
  *)
    printf 'Usage: %s [demo|test]\n' "$(basename "$0")" >&2
    exit 1
    ;;
esac

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"
export APP_IOT_DEMO_ENABLED="${APP_IOT_DEMO_ENABLED:-true}"
export APP_IOT_DEMO_SEED_ON_STARTUP="${APP_IOT_DEMO_SEED_ON_STARTUP:-true}"
export APP_IOT_DEMO_TENANT_CODE="${APP_IOT_DEMO_TENANT_CODE:-default}"
export APP_IOT_DEMO_MODE="${MODE}"
export APP_IOT_DEMO_GENERATION_INTERVAL_MS="${APP_IOT_DEMO_GENERATION_INTERVAL_MS:-$([[ "${MODE}" == "test" ]] && echo 4000 || echo 8000)}"
export APP_IOT_DEMO_INITIAL_DELAY_MS="${APP_IOT_DEMO_INITIAL_DELAY_MS:-$([[ "${MODE}" == "test" ]] && echo 5000 || echo 12000)}"
export APP_IOT_DEMO_MAX_PENDING_MAINTENANCE="${APP_IOT_DEMO_MAX_PENDING_MAINTENANCE:-$([[ "${MODE}" == "test" ]] && echo 4 || echo 6)}"

printf '\n[IoT Simulator] Starting backend generator in %s mode\n' "${APP_IOT_DEMO_MODE}"
printf '[IoT Simulator] tenant=%s interval=%sms initialDelay=%sms maxPendingMaintenance=%s\n' \
  "${APP_IOT_DEMO_TENANT_CODE}" \
  "${APP_IOT_DEMO_GENERATION_INTERVAL_MS}" \
  "${APP_IOT_DEMO_INITIAL_DELAY_MS}" \
  "${APP_IOT_DEMO_MAX_PENDING_MAINTENANCE}"

if [[ "${MODE}" == "test" ]]; then
  printf '[IoT Simulator] Predictable anomaly sequence enabled for smoke/validation.\n'
else
  printf '[IoT Simulator] Continuous demo pulse enabled for dashboard, telemetry, alarms, maintenance and observability.\n'
fi

printf '[IoT Simulator] Open /iot/dashboard, /iot/telemetry, /iot/alarms, /iot/maintenance and /iot/observability after startup.\n\n'

cd "${BACKEND_DIR}"
mvn spring-boot:run
