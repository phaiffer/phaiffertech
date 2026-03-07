# Phaiffer Platform Monorepo

Unified multi-tenant SaaS platform (CRM, Pet and IoT) built as a modular monolith.

## Stack

### Backend
- Java 21
- Spring Boot 3.x
- Maven
- Spring Security (JWT + RBAC + granular permissions)
- Micrometer + Prometheus + OpenTelemetry tracing bridge
- Spring Data JPA
- Flyway
- MySQL 8
- Springdoc OpenAPI
- Testcontainers (integration tests)

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Infra
- Docker Compose
- GitHub Actions CI
- Terraform (OCI base)
- Root Makefile

## Package Root

Backend package root is fixed:

- `com.phaiffertech.platform`

## Monorepo Structure

```text
.
├── Makefile
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── backend/
│   └── frontend/
├── docs/
└── infra/
```

## Platform Highlights

- Modular monolith with clear boundaries: `shared`, `core`, `modules`, `infrastructure`.
- Shared anti-duplication application layer in `shared.crud` for tenant-safe CRUD flows.
- Multi-tenancy with tenant context enforcement and tenant-isolated queries.
- Authorization model with `user_tenants` + `user_tenant_roles` + `role_permissions`.
- JWT access token + secure refresh token (hash + rotation + revoke on logout).
- Granular permission checks via `@RequirePermission`.
- Automatic auditing for auth and CRUD flows.
- Soft delete with `deleted_at` on business entities.
- Standard pagination contract (`page`, `size`, `sort`, `direction`, `search`).
- IoT split between control plane and data plane abstractions.
- Structured JSON logs with tenant/user/trace correlation.
- Actuator metrics + Prometheus endpoint.
- API rate limiting (auth, default API, telemetry ingestion).
- Feature flags (global + tenant) and module enablement guards.

## CRM Delivery Status

Legacy CRM reference was analyzed in `../crm-platform` only as a functional reference. Main conclusions:

- Legacy domains found: companies, contacts, leads, deals, pipeline stages, tasks, notes, campaigns, conversations, attachments, notifications, audit/activity, dashboard, invites, onboarding and chatbot.
- CRM V1 in this platform now covers: companies, contacts, leads, deals, pipeline stages, tasks, notes, activity feed and dashboard summary.
- Cross-module concerns remain outside CRM: notifications, attachments, invites and onboarding belong conceptually to `core`.
- Deferred to CRM V2: campaigns, conversations and chatbot-oriented flows.

Gap decision summary:

| Domain | Status na nova plataforma |
| --- | --- |
| companies | já implementado |
| contacts | já implementado |
| leads | já implementado |
| deals | já implementado |
| pipeline stages | já implementado |
| tasks | já implementado |
| notes | já implementado |
| activity feed | já implementado |
| dashboard | já implementado |
| notifications | mover para core |
| attachments | mover para core |
| invites | mover para core |
| onboarding | mover para core |
| campaigns | adiar para CRM V2 |
| conversations | adiar para CRM V2 |
| chatbot | adiar para CRM V2 |

## IoT Delivery Status

The legacy IoT reference at `../iotsystem` was analyzed only as a functional and technical reference. Main legacy findings:

- domains: devices, registers, telemetry ingestion, alarms, maintenance, reports, device health, audit, governance/plans/quotas and observability
- operational flows: telemetry poller, alarm events, maintenance closeout, executive reporting and health history
- architecture references: ADRs for Kafka-based telemetry pipeline and split OLTP + TSDB storage
- commercial value retained for V1: configurable device/register base, telemetry ingestion and query, alarm lifecycle, maintenance queue and operational summary dashboards

Gap analysis used for IoT V1 scope:

| Funcionalidade | Status na nova plataforma |
| --- | --- |
| devices | já implementado |
| registers / sensors | já implementado |
| telemetry write | já implementado |
| telemetry read/query | já implementado |
| alarms | já implementado |
| alarm acknowledge | já implementado |
| maintenance | já implementado |
| reports | já implementado |
| monitoring dashboard | já implementado |
| polling | adiar para IoT V2 |
| device health | parcialmente implementado |
| governance / quotas | depende de abstração futura |
| metrics / tracing | parcialmente implementado |
| activity / audit | parcialmente implementado |

IoT V1 delivered:

- devices
- registers modeled as logical telemetry channels
- telemetry ingestion and query
- alarms + acknowledge
- maintenance
- dashboard summary
- basic reports summary
- basic device health/status based on `lastSeenAt`, recent telemetry and critical open alarms

Deferred to IoT V2:

- Kafka-first ingestion pipeline
- TSDB/TimescaleDB mandatory storage
- advanced polling
- advanced risk scoring
- predictive analytics
- advanced plan/quota governance
- deep per-device observability and analytics dashboards

## Flyway Migrations

- `V1__init_schema.sql`
- `V2__init_crm_schema.sql`
- `V3__init_pet_schema.sql`
- `V4__init_iot_schema.sql`
- `V5__seed_reference_data.sql`
- `V6__seed_permissions.sql`
- `V7__refresh_token_security.sql`
- `V8__crm_extended_schema.sql`
- `V9__tenant_role_model.sql`
- `V10__crm_contacts_leads_improvements.sql`
- `V11__crm_pipeline_and_deals.sql`
- `V12__crm_notes_and_tasks.sql`
- `V13__pet_v1_schema.sql`
- `V14__iot_v1_schema.sql`
- `V15__seed_pet_iot_permissions.sql`
- `V16__feature_flags.sql`
- `V17__rate_limit_support.sql`
- `V18__crm_companies_pipeline_deals.sql`
- `V19__crm_tasks_notes_activity.sql`
- `V20__crm_permissions_seed.sql`
- `V21__iot_devices_registers.sql`
- `V22__iot_telemetry_alarms.sql`
- `V23__iot_maintenance_dashboard_permissions.sql`

## Main Endpoints (`/api/v1`)

### Auth
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Core
- `GET /health`
- `GET|POST /tenants`
- `GET|POST /users`
- `GET /modules`
- `GET /feature-flags`
- `GET /actuator/metrics`
- `GET /actuator/prometheus`
- `GET /actuator/health`

### CRM
- Companies:
  - `GET|POST /crm/companies`
  - `GET|PUT|DELETE /crm/companies/{id}`
- Contacts:
  - `GET|POST /crm/contacts`
  - `GET|PUT|DELETE /crm/contacts/{id}`
  - `PATCH /crm/contacts/{id}/restore`
- Leads:
  - `GET|POST /crm/leads`
  - `GET|PUT|DELETE /crm/leads/{id}`
  - `PATCH /crm/leads/{id}/restore`
- Pipeline stages:
  - `GET|POST /crm/pipeline-stages`
  - `GET|PUT|DELETE /crm/pipeline-stages/{id}`
- Deals:
  - `GET|POST /crm/deals`
  - `GET|PUT|DELETE /crm/deals/{id}`
- Tasks:
  - `GET|POST /crm/tasks`
  - `GET|PUT|DELETE /crm/tasks/{id}`
- Notes:
  - `GET|POST /crm/notes`
  - `GET|PUT|DELETE /crm/notes/{id}`
- Activity and dashboard:
  - `GET /crm/activity`
  - `GET /crm/dashboard/summary`

### Pet / IoT
- Pet clients:
  - `GET|POST /pet/clients`
  - `GET|PUT|DELETE /pet/clients/{id}`
  - `PATCH /pet/clients/{id}/restore`
- Pet profiles:
  - `GET|POST /pet/pets`
  - `GET|PUT|DELETE /pet/pets/{id}`
  - `PATCH /pet/pets/{id}/restore`
- Pet appointments:
  - `GET|POST /pet/appointments`
  - `GET|PUT|DELETE /pet/appointments/{id}`
  - `PATCH /pet/appointments/{id}/restore`
- IoT devices:
  - `GET|POST /iot/devices`
  - `GET|PUT|DELETE /iot/devices/{id}`
  - `PATCH /iot/devices/{id}/restore`
- IoT registers:
  - `GET|POST /iot/registers`
  - `GET|PUT|DELETE /iot/registers/{id}`
  - `PATCH /iot/registers/{id}/restore`
- IoT alarms:
  - `GET|POST /iot/alarms`
  - `GET|PUT|DELETE /iot/alarms/{id}`
  - `POST /iot/alarms/{id}/acknowledge`
  - `PATCH /iot/alarms/{id}/restore`
- IoT telemetry:
  - `GET|POST /iot/telemetry`
- IoT maintenance:
  - `GET|POST /iot/maintenance`
  - `GET|PUT|DELETE /iot/maintenance/{id}`
  - `PATCH /iot/maintenance/{id}/restore`
- IoT monitoring and reports:
  - `GET /iot/dashboard/summary`
  - `GET /iot/reports/summary`

Swagger UI:
- `http://localhost:8080/swagger-ui.html`

## Frontend

Implemented pages:

- Public/Auth: `/login`
- Core: `/dashboard`, `/tenants`, `/users`, `/settings`
- CRM:
  - `/crm`
  - `/crm/dashboard`
  - `/crm/activity`
  - `/crm/companies`
  - `/crm/contacts`, `/crm/contacts/new`, `/crm/contacts/[id]`
  - `/crm/leads`, `/crm/leads/new`, `/crm/leads/[id]`
  - `/crm/deals`
  - `/crm/pipeline`
  - `/crm/tasks`
  - `/crm/notes`
- PET:
  - `/pet`
  - `/pet/clients`
  - `/pet/pets`
  - `/pet/appointments`
- IoT:
  - `/iot`
  - `/iot/dashboard`
  - `/iot/devices`
  - `/iot/registers`
  - `/iot/alarms`
  - `/iot/telemetry`
  - `/iot/maintenance`
  - `/iot/reports`

Guards:
- Route protection via authenticated layout (`ProtectedRoute`).
- Permission checks via `PermissionGuard` + `usePermissions`.
- Sidebar module visibility based on permissions + module enablement/feature flags.
- Global error boundary + client-side structured logger.

## Quick Start (Docker)

1. Copy env file:

```bash
cp .env.example .env
```

2. Start stack:

```bash
make up
```

3. Access:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Adminer (optional): `http://localhost:8081` (`docker compose --profile tools up -d`)
- Prometheus (optional): `http://localhost:9090` (`make observability-up`)
- Grafana (optional): `http://localhost:3001` (`make observability-up`)

## Local Development

Backend:

```bash
make backend
```

Frontend:

```bash
make frontend
```

## Makefile

List commands:

```bash
make help
```

Main targets:
- `make up`, `make down`, `make restart`, `make status`
- `make logs-follow`, `make logs-all`, `make logs-json`, `make logs-backend`, `make logs-frontend`, `make logs-db`
- `make docker-build`, `make docker-reset-db`
- `make test`, `make test-backend`, `make test-integration`, `make test-unit`, `make test-pet`, `make test-iot`
- `make build`, `make verify`, `make ci`
- `make metrics`
- `make observability-up`, `make observability-down`
- `make terraform-init`, `make terraform-plan`
- `make migrate`, `make crm-seed`, `make pet-seed`, `make iot-seed`, `make db-shell`

## Docker Profiles

- default (sem profile): mysql + backend + frontend
- `tools`: adminer
- `observability`: prometheus + grafana + loki

## Integration Tests

Integration tests are under:

- `apps/backend/src/test/java/com/phaiffertech/platform/integration`
- `apps/backend/src/test/java/com/phaiffertech/platform/integration/crm`
- `apps/backend/src/test/java/com/phaiffertech/platform/support`

Current coverage includes:
- auth (`login`, `refresh`, `me`)
- tenant isolation
- tenant-role resolution and permission inheritance
- permission enforcement
- CRM contacts/leads CRUD
- CRM companies/deals/pipeline/tasks/notes CRUD
- CRM dashboard summary and activity feed
- PET clients/profiles/appointments CRUD
- IoT devices/alarms CRUD
- IoT telemetry write/read
- shared CRUD behavior (soft delete, tenant filter, pagination behavior)
- pagination contract

Execution:

```bash
make test-integration
```

Notes:
- Testcontainers + MySQL are mandatory for integration tests.
- Integration test bootstrap sets Docker `api.version=1.44` by default (can be overridden with `DOCKER_API_VERSION`).

## CI/CD

- Workflow file: `.github/workflows/ci.yml`
- Stages:
  - backend `mvn clean verify`
  - frontend `npm ci && npm run lint && npm run build`
  - docker build (`docker compose build backend frontend`)

## Terraform (OCI)

Initial IaC base is available at `infra/terraform`:
- `provider.tf`
- `variables.tf`
- `network.tf`
- `compute.tf`
- `mysql.tf`
- `outputs.tf`

## Dev Credentials

- Tenant code: `default`
- Email: `admin@local.test`
- Password: `Admin@123`

## Default Ports

- MySQL: `3306`
- Backend: `8080`
- Frontend: `3000`
- Adminer: `8081`
