# Platform Architecture

## Overview

The platform is implemented as a **modular monolith** with multi-tenancy from day one.

Core principles:
- single database + shared schema
- `tenant_id` isolation on tenant-scoped data
- strict package boundaries by domain module
- JWT authentication + role and permission-based authorization
- incremental Flyway migrations

## Backend Package Root

- `com.phaiffertech.platform`

## Backend Package Tree

```text
com.phaiffertech.platform
├── PlatformApplication
├── shared
│   ├── config
│   ├── domain
│   │   ├── base
│   │   └── enums
│   ├── exception
│   ├── pagination
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
│   │   └── lead
│   ├── pet
│   │   └── client
│   └── iot
│       ├── alarm
│       ├── control
│       ├── device
│       ├── ingestion
│       ├── maintenance
│       ├── monitoring
│       ├── processing
│       ├── report
│       ├── sensor
│       └── telemetry
└── infrastructure
    ├── docs
    ├── persistence
    └── web
```

## Multi-Tenancy

- `TenantContext` stores current tenant ID per request.
- `TenantContextFilter` enforces header/authenticated tenant consistency.
- Cross-tenant access is blocked early (`403`) before business logic.

## Security Model

### Authentication
- JWT access token.
- Refresh token persisted with hash (`SHA-256`) and expiry.
- Refresh rotation: old refresh token revoked on refresh/login.
- Logout endpoint revokes refresh token.

### Authorization
- Role-based authorities remain active (`ROLE_*`).
- Roles are resolved per tenant through `user_tenants` + `user_tenant_roles`.
- Granular permissions introduced with `@RequirePermission("...")`.
- Permission inheritance via `role_permissions`.
- Permissions are loaded at login/refresh and embedded in JWT claims.
- JWT carries `user_id`, `tenant_id`, `role`, `roles`, and `permissions`.

Examples:
- `crm.contact.read`
- `crm.contact.create`
- `crm.lead.update`
- `pet.client.read`
- `iot.device.read`

## Auditing

### Audit entity
`audit_logs` stores:
- `tenant_id`
- `user_id`
- `action`
- `entity_name`
- `entity_id`
- `payload`
- `created_at`

### Automatic logging
- CRUD operations are annotated with `@AuditableAction`.
- Auth events (`LOGIN`, `REFRESH_TOKEN`, `LOGOUT`) are logged in auth service.

## Soft Delete

Key business entities (CRM/Pet/IoT) use:
- `deleted_at` column
- logical delete operations in services
- `@Where(clause = "deleted_at IS NULL")`
- optional restore endpoints (`PATCH .../restore`)

## Pagination and Filtering Standard

Shared classes under `shared/pagination`:
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

Standard response shape:
- `items`
- `page`
- `size`
- `totalItems`
- `totalPages`

Legacy fields (`content`, `totalElements`) are still returned for compatibility.

Applied on list endpoints across core/modules, including CRM contacts/leads, pet clients and IoT devices.

## IoT Control/Data Plane Split

- Control plane: administrative flows (`device`, `alarm`, and related operational modules).
- Data plane: telemetry/ingestion (`telemetry`, `ingestion`, `processing`).
- Abstractions:
  - `TelemetryWriter`
  - `TelemetryReader`
  - `AlarmEvaluator`
- Current persistence implementation is MySQL (`MySqlTelemetryStore`), preserving future storage swap flexibility.

## CRM Module v1

### Contacts
- Full CRUD + restore
- search + pagination
- validation and permission checks

### Leads
- Full list/create/update/delete + restore
- search + pagination
- validation and permission checks

## Migration Strategy

Current migrations:
- `V1__init_schema.sql`
- `V2__init_crm_schema.sql`
- `V3__init_pet_schema.sql`
- `V4__init_iot_schema.sql`
- `V5__seed_reference_data.sql`
- `V6__seed_permissions.sql`
- `V7__refresh_token_security.sql`
- `V8__crm_extended_schema.sql`
- `V9__tenant_role_model.sql`

`V1` was preserved for backward compatibility. New capabilities were added incrementally.

## Tests

Integration tests are under:
- `apps/backend/src/test/java/com/phaiffertech/platform/integration`

Coverage includes:
- auth (`login`, `refresh`, `me`)
- multi-tenant isolation
- tenant role resolution and permission inheritance
- standardized pagination contract validation
- CRM contact CRUD
- IoT device create/list
- IoT telemetry ingestion/list + alarm evaluation
- Pet client create

Test runtime uses Testcontainers + MySQL, with automatic skip when Docker is unavailable/incompatible.

## Makefile Role

Root `Makefile` is the main developer entrypoint for:
- stack lifecycle (`up`, `down`, `restart`, `status`)
- docker tooling (`docker-build`, `docker-reset-db`, `logs-follow`)
- backend/frontend local run and build
- migration and seed helpers (`migrate`, `crm-seed`)
- backend test targets (`test-backend`, `test-integration`)
