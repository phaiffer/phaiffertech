# Platform Architecture

## Overview

The platform is implemented as a **modular monolith** with multi-tenancy from the beginning.

Principles:
- single MySQL database, shared schema
- tenant isolation by `tenant_id`
- domain boundaries by package/module
- incremental evolution through Flyway migrations
- security first (JWT + tenant roles + permissions)

## Backend Package Root

- `com.phaiffertech.platform`

## Backend Package Layout

```text
com.phaiffertech.platform
├── PlatformApplication
├── shared
│   ├── config
│   ├── crud
│   ├── domain
│   │   ├── base
│   │   └── enums
│   ├── exception
│   ├── health
│   ├── logging
│   ├── metrics
│   ├── pagination
│   ├── ratelimit
│   ├── response
│   ├── security
│   ├── tenancy
│   └── util
├── core
│   ├── auth
│   ├── tenant
│   ├── user
│   ├── iam
│   ├── settings
│   ├── audit
│   ├── notification
│   ├── attachment
│   ├── subscription
│   └── module
├── modules
│   ├── crm
│   │   ├── contact
│   │   ├── lead
│   │   ├── pipeline
│   │   ├── deal
│   │   ├── note
│   │   └── task
│   ├── pet
│   │   ├── client
│   │   ├── petprofile
│   │   └── appointment
│   └── iot
│       ├── control
│       ├── device
│       ├── telemetry
│       ├── processing
│       ├── alarm
│       ├── ingestion
│       ├── sensor
│       ├── maintenance
│       ├── report
│       └── monitoring
└── infrastructure
    ├── docs
    ├── persistence
    └── web
```

## Multi-Tenancy

- `TenantContext` carries active tenant ID per request.
- `TenantContextFilter` validates tenant header against authenticated context.
- Tenant-scoped queries are mandatory on business data.
- Cross-tenant access is rejected with `403`.

## Observability

### Structured Logging
- Logback JSON output (`logback-spring.xml`)
- MDC context: `trace_id`, `span_id`, `tenant_id`, `user_id`
- Request log filter emits method/path/status/duration

### Metrics
- Actuator endpoints:
  - `/actuator/metrics`
  - `/actuator/prometheus`
- Custom counters:
  - `crm.contacts.created`
  - `pet.appointments.created`
  - `iot.telemetry.received`
  - `iot.alarms.triggered`
  - `auth.attempts` (tagged by outcome)

### Tracing
- Micrometer tracing bridge with OpenTelemetry.
- Trace and span identifiers are correlated into structured logs.

### Health
- Expanded `/actuator/health` with:
  - database indicator
  - migration status indicator
  - redis future-ready indicator
  - telemetry pipeline indicator

## Shared CRUD Layer

`shared.crud` centralizes recurring CRUD behavior without hiding module rules.

Main components:
- `BaseTenantCrudService`
- `BaseTenantCrudRepository`
- `BaseCrudMapper`
- `BaseSearchSpecificationBuilder`
- `BasePageQuery`
- `BaseSoftDeleteService`
- `BaseAuditableCrudHooks`

Applied modules:
- CRM: contacts and leads
- PET: clients, profiles and appointments
- IoT: devices and alarms

## Authorization Model

Entities:
- `users` (global identity)
- `tenants` (organization)
- `user_tenants` (user-tenant binding)
- `user_tenant_roles` (roles bound to the active user-tenant relation)
- `roles`, `permissions`, `role_permissions`

Resolution flow:
1. Login identifies user + tenant.
2. System resolves `user_tenant` and `user_tenant_roles`.
3. Permissions are aggregated from `role_permissions`.
4. JWT includes `user_id`, `tenant_id`, `roles`, `permissions`.

Enforcement:
- role checks via Spring Security
- granular checks via `@RequirePermission("...")`
- module guard for `/api/v1/crm/**`, `/api/v1/pet/**`, `/api/v1/iot/**`
- feature flag checks (global and tenant-scoped)

## Rate Limiting

- Bucket4j filter-based strategy in `shared.ratelimit`.
- Policies:
  - auth endpoints: 10 req/min
  - default API: 100 req/min
  - telemetry ingestion (`POST /api/v1/iot/telemetry`): 500 req/min

Support table:
- `rate_limit_policies` (future policy externalization)

## Refresh Token Security

- Raw refresh token is never stored.
- `refresh_tokens.token_hash` stores SHA-256 hash.
- Rotation on refresh: old token revoked, new token generated.
- Logout endpoint revokes active token.

## Auditing

`audit_logs` captures:
- tenant and user context
- action (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `REFRESH_TOKEN`, etc.)
- entity and entity id
- optional payload snapshot
- timestamp

Audit events are emitted by AOP annotation (`@AuditableAction`) and auth flows.

## Soft Delete

Business entities use:
- `deleted_at`
- `@Where(clause = "deleted_at IS NULL")`
- optional restore endpoints where relevant

This preserves history and avoids hard-delete by default.

## Pagination Contract

Shared package: `shared.pagination`

Main classes:
- `PageRequestDto`
- `PageResponseDto`
- `PageMapper`
- `PaginationUtils`

Standard query params:
- `page`
- `size`
- `sort`
- `direction`
- `search`

Standard response:
- `items`
- `page`
- `size`
- `totalItems`
- `totalPages`

Legacy fields (`content`, `totalElements`) remain for compatibility.

## CRM v1

### Contacts
- CRUD + restore
- search by name/email/company
- filters by status and owner
- soft delete + auditing + permission checks

### Leads
- CRUD + restore
- search and filters by status/source/assigned user
- soft delete + auditing + permission checks

### Pipeline/Deals base
- pipeline + stages
- deals with pipeline/stage/contact/lead references

### Notes/Tasks base
- tenant-scoped notes linked by related type/id
- tenant-scoped tasks with assignee and due date

## IoT Control Plane vs Data Plane

- Control plane: administrative CRUD (`device`, alarms and operational metadata).
- Data plane: telemetry ingestion and processing.

Abstractions:
- `TelemetryWriter`
- `TelemetryReader`
- `AlarmEvaluator`

Current implementation uses MySQL (`MySqlTelemetryStore`) but keeps interface boundaries ready for future storage extraction.

## Migration Strategy

Current migration chain:
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

Previous migrations were preserved; new changes are strictly incremental.

## Test Architecture

Folders:
- `src/test/java/com/phaiffertech/platform/support`
- `src/test/java/com/phaiffertech/platform/integration`
- `src/test/java/com/phaiffertech/platform/integration/crm`

Base classes:
- `IntegrationTestContainersConfig` (singleton MySQL Testcontainer + dynamic datasource properties)
- `AbstractIntegrationTest` (HTTP and SQL helpers)

Coverage includes:
- auth login/refresh/me
- tenant isolation
- tenant role and permission resolution
- permission enforcement
- CRM contacts/leads CRUD
- PET clients/profiles/appointments CRUD
- IoT devices/alarms CRUD
- IoT telemetry write/read
- shared CRUD behavior (tenant filter + soft delete + paginated list contract)
- pagination contract

Docker compatibility note:
- tests run with Testcontainers and require Docker.
- Integration test bootstrap sets `api.version=1.44` by default, overridable through `DOCKER_API_VERSION`.

## DevOps Foundation

### CI
- GitHub Actions workflow at `.github/workflows/ci.yml`
- Runs backend build/tests, frontend lint/build and docker image build

### Docker Compose Profiles
- default (sem profile): mysql + backend + frontend
- `tools`: adminer
- `observability`: prometheus + grafana + loki

### Terraform (Oracle Cloud)
Base IaC scaffolding at `infra/terraform`:
- provider and variables
- network (VCN, subnets, route/security primitives)
- compute and load balancer
- managed MySQL service blueprint
