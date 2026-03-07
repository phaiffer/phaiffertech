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

## CRM v1 Scope

- Contacts CRUD + restore + filters + pagination.
- Leads CRUD + restore + filters + pagination.
- Pipeline/deal base endpoints.
- Notes/tasks base endpoints.

## PET v1 Scope

- Clients CRUD + restore + search + pagination.
- Pet profiles CRUD + restore + tenant-safe client linkage.
- Appointments CRUD + restore + filters by status/date/user/client/pet.

## IoT v1 Scope

- Devices CRUD + restore + search + pagination.
- Alarms CRUD + acknowledge + restore.
- Telemetry write/read with paginated query by device and period.
- Control plane and data plane abstractions:
  - `TelemetryWriter`
  - `TelemetryReader`
  - `AlarmEvaluator`

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

## Operational Endpoints

- `GET /actuator/health`
- `GET /actuator/metrics`
- `GET /actuator/prometheus`
- `GET /api/v1/feature-flags`

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
