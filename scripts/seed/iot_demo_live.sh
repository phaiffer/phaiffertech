#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/apps/backend"

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"
export APP_IOT_DEMO_ENABLED="${APP_IOT_DEMO_ENABLED:-true}"
export APP_IOT_DEMO_SEED_ON_STARTUP="${APP_IOT_DEMO_SEED_ON_STARTUP:-true}"
export APP_IOT_DEMO_TENANT_CODE="${APP_IOT_DEMO_TENANT_CODE:-default}"
export APP_IOT_DEMO_GENERATION_INTERVAL_MS="${APP_IOT_DEMO_GENERATION_INTERVAL_MS:-8000}"
export APP_IOT_DEMO_INITIAL_DELAY_MS="${APP_IOT_DEMO_INITIAL_DELAY_MS:-12000}"
export APP_IOT_DEMO_MAX_PENDING_MAINTENANCE="${APP_IOT_DEMO_MAX_PENDING_MAINTENANCE:-6}"

printf '\n[IoT Demo] Starting backend live generator with tenant=%s interval=%sms\n' \
  "${APP_IOT_DEMO_TENANT_CODE}" \
  "${APP_IOT_DEMO_GENERATION_INTERVAL_MS}"
printf '[IoT Demo] Open the frontend after startup and navigate to /iot/dashboard, /iot/telemetry, /iot/alarms and /iot/observability.\n\n'

cd "${BACKEND_DIR}"
mvn spring-boot:run
