# Backend - Platform API

Spring Boot backend for the modular multi-tenant platform.

## Stack

- Java 21
- Spring Boot 3.3.x
- Maven
- Spring Security (JWT + RBAC + granular permissions)
- Spring Data JPA
- Flyway
- MySQL 8
- Springdoc OpenAPI
- Testcontainers
- Micrometer + Prometheus + OpenTelemetry tracing bridge

## Package Root

- `com.phaiffertech.platform`

## Core Capabilities

- Multi-tenancy via `TenantContext` + request filter enforcement.
- Tenant-scoped role model: `user_tenants` + `user_tenant_roles`.
- Permission inheritance from roles (`role_permissions`).
- `@RequirePermission` for granular authorization.
- Secure refresh tokens:
  - hashed storage
  - rotation on refresh
  - revocation on logout
- Automatic auditing for auth and business actions.
- Soft delete support with `deleted_at` and restore flows.
- Standard pagination DTOs and mapping utilities.
- Shared CRUD support layer in `shared.crud` to reduce boilerplate in tenant modules.
- Structured JSON request logging with tenant/user/trace correlation.
- Rate limiting via Bucket4j.
- Feature flags (global + tenant) and module access guard.
- Brute-force protection on login endpoint.
- Expanded actuator health indicators for migration and telemetry pipeline status.

## Architecture Guardrails

Core packages:

- `core.auth`, `core.tenant`, `core.user`, `core.iam`
- `core.settings`, `core.audit`, `core.notification`, `core.attachment`
- `core.module` for module registry, feature flags, module enablement and platform dashboard aggregation
- `shared.*` only for technical infrastructure, generic CRUD support and cross-module contracts

Vertical packages:

- `modules.crm`: CRM business rules and persistence
- `modules.iot`: IoT business rules and persistence
- `modules.pet`: Pet business rules and persistence

Enforced rules:

- `core` and `shared` do not import business classes from vertical modules
- one vertical module does not import another vertical module
- platform aggregation uses `shared.contracts.module.ModuleSummaryCapability`
- module access is evaluated centrally by `ModuleAccessService` and enforced by `ModuleAccessGuard`

Current capability contracts:

- `CrmDashboardCapability`
- `IotDashboardCapability`
- `PetDashboardCapability`

## CRM v1 Scope

- Contacts CRUD + restore + filters + pagination.
- Leads CRUD + restore + filters + pagination.
- Pipeline/deal base endpoints.
- Notes/tasks base endpoints.

## PET v1 Scope

- Clients CRUD + restore + search + pagination.
- Pet profiles CRUD + restore + tenant-safe client linkage.
- Appointments CRUD + restore + filters by status/date/user/client/pet.
- Services CRUD + pagination.
- Professionals CRUD + pagination.
- Medical records, vaccinations and prescriptions CRUD.
- Products, inventory movements and invoices CRUD.

## IoT v1 Scope

- Devices CRUD + restore + search + pagination.
- Registers CRUD + restore + search + pagination.
- Alarms CRUD + acknowledge + restore.
- Maintenance CRUD + restore + search + pagination.
- Telemetry write/read with paginated query by device, register, metric and period.
- Monitoring and reporting:
  - `GET /api/v1/iot/dashboard/summary`
  - `GET /api/v1/iot/reports/summary`
- Platform aggregation:
  - `GET /api/v1/dashboard/summary`
- Module catalog:
  - `GET /api/v1/modules`
- Control plane and data plane abstractions:
  - `TelemetryWriter`
  - `TelemetryReader`
  - `AlarmEvaluator`
  - `DeviceStatusService`
  - `MonitoringSummaryService`

Legacy-guided decisions:

- `../iotsystem` was used only as a reference for business scope, not copied into the monorepo.
- `registers` were modeled as logical telemetry channels instead of importing legacy protocol-specific details directly.
- telemetry remains on MySQL for this stage, but access goes through data-plane abstractions to keep TSDB evolution open.

Current IoT V1 permissions:

- `iot.device.read|create|update|delete`
- `iot.register.read|create|update|delete`
- `iot.telemetry.read|write`
- `iot.alarm.read|create|update|delete|ack`
- `iot.maintenance.read|create|update|delete`
- `iot.dashboard.read`
- `iot.report.read`

## Migrations

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
- `V24__pet_clients_pets.sql`
- `V25__pet_appointments_services.sql`
- `V26__pet_medical_records.sql`
- `V27__pet_products_inventory_invoices.sql`

## IoT API Surface

- Devices:
  - `GET|POST /api/v1/iot/devices`
  - `GET|PUT|DELETE /api/v1/iot/devices/{id}`
  - `PATCH /api/v1/iot/devices/{id}/restore`
- Registers:
  - `GET|POST /api/v1/iot/registers`
  - `GET|PUT|DELETE /api/v1/iot/registers/{id}`
  - `PATCH /api/v1/iot/registers/{id}/restore`
- Telemetry:
  - `GET|POST /api/v1/iot/telemetry`
- Alarms:
  - `GET|POST /api/v1/iot/alarms`
  - `GET|PUT|DELETE /api/v1/iot/alarms/{id}`
  - `POST /api/v1/iot/alarms/{id}/acknowledge`
  - `PATCH /api/v1/iot/alarms/{id}/restore`
- Maintenance:
  - `GET|POST /api/v1/iot/maintenance`
  - `GET|PUT|DELETE /api/v1/iot/maintenance/{id}`
  - `PATCH /api/v1/iot/maintenance/{id}/restore`
- Monitoring and reports:
  - `GET /api/v1/iot/dashboard/summary`
  - `GET /api/v1/iot/reports/summary`

## Operational Endpoints

- `GET /actuator/health`
- `GET /actuator/metrics`
- `GET /actuator/prometheus`
- `GET /api/v1/modules`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/feature-flags`

## Module Access Model

The platform treats these concerns separately:

- module enabled: tenant-level binding from `tenant_modules`
- feature flag: rollout-level gate from `feature_flags`
- permission: user-level authorization from `role_permissions`

The `/api/v1/modules` response now exposes:

- `moduleEnabled`
- `featureFlagEnabled`
- `available`

`available` is the final value used by the frontend menus and module guards.

## Run Locally

```bash
mvn spring-boot:run
```

## Build

```bash
mvn clean compile
mvn package
```

## Tests

```bash
mvn test
```

Run only integration tests:

```bash
mvn -Dtest='*IntegrationTest' test
```

Test support base classes:
- `src/test/java/com/phaiffertech/platform/support/IntegrationTestContainersConfig.java`
- `src/test/java/com/phaiffertech/platform/support/AbstractIntegrationTest.java`
- CRM integration suite: `src/test/java/com/phaiffertech/platform/integration/crm`

Important:
- Integration tests require Docker.
- Integration test bootstrap sets `api.version=1.44` by default (override with `DOCKER_API_VERSION`).

## Development Seed

Default credentials (dev):
- Tenant: `default`
- Email: `admin@local.test`
- Password: `Admin@123`
