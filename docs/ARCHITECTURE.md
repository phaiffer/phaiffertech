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
│   │   ├── activity
│   │   ├── company
│   │   ├── contact
│   │   ├── dashboard
│   │   ├── lead
│   │   ├── pipeline
│   │   ├── deal
│   │   ├── note
│   │   ├── shared
│   │   └── task
│   ├── pet
│   │   ├── client
│   │   ├── petprofile
│   │   └── appointment
│   └── iot
│       ├── device
│       ├── register
│       ├── telemetry
│       ├── processing
│       ├── alarm
│       ├── control
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
- IoT: devices, registers, maintenance and alarms where CRUD is sufficient; telemetry keeps explicit data-plane services

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

## IoT Legacy Functional Summary

The legacy reference at `../iotsystem` was inspected as a reference source only. Main findings:

- control-plane domains: devices, registers, alarm rules/events, maintenance orders, reports metadata, governance/plans/quotas and audit trail
- data-plane and runtime flows: telemetry ingestion, telemetry poller, device health history, dashboard summaries and alert generation
- integrations found in the legacy repository:
  - dedicated telemetry poller service
  - Kafka topics for raw/status/dead-letter telemetry
  - split OLTP + TSDB design with separate datasource/flyway ADRs
  - health indicators, metrics, tracing and rate limiting support
- high-value features reused as V1 scope in this platform:
  - device registry
  - logical registers/sensors
  - telemetry ingestion/query
  - alarms with acknowledge
  - maintenance queue
  - operational dashboard and summary reports

Important modeling decision for the new platform:

- the legacy `register` concept includes protocol-level concerns such as addresses and function codes
- IoT V1 in this platform models `registers` as logical telemetry channels linked to a device
- protocol/runtime specifics remain future-ready and were not copied into the new control plane

## IoT Gap Analysis

Comparison baseline:

- legacy reference: `../iotsystem`
- current platform code:
  - `apps/backend/src/main/java/com/phaiffertech/platform/modules/iot`
  - `apps/frontend/src/app/(app)/iot`
  - `apps/frontend/src/modules/iot`

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

Status interpretation:

- `já implementado`: delivered in backend + frontend with tenant-aware flows
- `parcialmente implementado`: basic coverage exists, but not at the same operational depth as legacy
- `depende de abstração futura`: belongs partly to shared subscription/governance layers, not only IoT
- `adiar para IoT V2`: intentionally excluded from commercial V1 scope

## IoT V1 Scope

Mandatory V1 delivered:

- devices
- registers
- telemetry ingestion
- telemetry query
- alarms
- alarm acknowledge
- maintenance
- dashboard summary

Recommended V1 delivered:

- reports summary
- device status
- operational counters
- basic last-seen/health logic

Explicitly deferred to IoT V2:

- Kafka as mandatory ingestion backbone
- TSDB/TimescaleDB as mandatory telemetry store
- advanced polling orchestration
- advanced risk scoring
- predictive analytics
- advanced quotas/plans/governance
- deep observability by device and analytical dashboards

## IoT Control Plane vs Data Plane

Control plane responsibilities:

- devices
- registers
- maintenance
- configuration and metadata concerns

Data plane responsibilities:

- telemetry ingestion
- telemetry storage abstraction
- telemetry query
- alarm evaluation
- monitoring summaries
- report aggregates

Current backend abstractions that preserve this split:

- `TelemetryWriter`
- `TelemetryReader`
- `AlarmEvaluator`
- `DeviceStatusService`
- `MonitoringSummaryService`

This keeps MySQL practical for the current stage without treating it as the permanent final architecture for telemetry.

## IoT V1 Implementation Notes

Backend domains now in active use:

- `modules.iot.device`
- `modules.iot.register`
- `modules.iot.telemetry`
- `modules.iot.alarm`
- `modules.iot.maintenance`
- `modules.iot.monitoring`
- `modules.iot.report`
- `modules.iot.processing`

Device health rule in V1:

- `ALERT` when a critical open alarm exists for the device
- `ONLINE` when recent telemetry and/or fresh `lastSeenAt` is available without critical open alarm
- `OFFLINE` when the device has stale last-seen / no recent telemetry
- `MAINTENANCE` remains available as an explicit operational status on the control plane

## Legacy CRM Functional Summary

The legacy CRM at `../crm-platform` was inspected only as a reference source. Functional findings:

- companies: tenant/organization scoped company registry with owner, contact channels, status and audit trail.
- contacts: linked to companies, unique email rules, soft delete and owner/status filtering.
- leads: source and status management, optional company/contact linkage, notes and conversion to deal.
- deals: stage transitions, expected close date, amount/probability and linkage with company/contact/lead.
- pipeline stages: ordered stages with default stage handling.
- tasks: linked to CRM entities, due date/assignee, notification emission and audit logging.
- notes: linked to CRM entities, author tracking and audit logging.
- campaigns: campaign registry with targets from contacts/leads and schedule validation.
- conversations: conversation and message threads, plus attachment linkage.
- attachments: generic file linkage to CRM entities.
- notifications: user-level operational notifications.
- activity feed: audit-log-based event history.
- dashboard: summary counts plus task and pipeline snapshots.
- invites/onboarding: tenant bootstrap and initial admin creation.
- chatbot: conversational helper with stored conversation history.

## CRM Gap Analysis and Scope

The table below reflects the decision taken for the new platform after comparing the legacy CRM against `apps/backend/src/main/java/com/phaiffertech/platform/modules/crm`.

| Funcionalidade | Status na nova plataforma | Decisão |
| --- | --- | --- |
| companies | não implementado no início da etapa | já implementado em CRM V1 |
| contacts | parcialmente implementado no início da etapa | já implementado em CRM V1 |
| leads | parcialmente implementado no início da etapa | já implementado em CRM V1 |
| deals | parcialmente implementado no início da etapa | já implementado em CRM V1 |
| pipeline stages | parcialmente implementado no início da etapa | já implementado em CRM V1 |
| tasks | parcialmente implementado no início da etapa | já implementado em CRM V1 |
| notes | parcialmente implementado no início da etapa | já implementado em CRM V1 |
| activity feed | não implementado no início da etapa | já implementado em CRM V1 usando `core.audit` |
| dashboard summary | não implementado no início da etapa | já implementado em CRM V1 |
| notifications | não integrado no CRM | mover para `core.notification` |
| attachments | não implementado no CRM | mover para `core.attachment` |
| invites | fora do módulo CRM | mover para `core`/tenant lifecycle |
| onboarding | fora do módulo CRM | mover para `core`/tenant lifecycle |
| campaigns | não implementado | adiar para CRM V2 |
| conversations | não implementado | adiar para CRM V2 |
| chatbot | não implementado | adiar para CRM V2 |

## CRM V1 Scope

Mandatory scope delivered:

- companies
- contacts
- leads
- deals
- pipeline stages
- tasks
- notes

Recommended V1 scope delivered:

- activity feed (`GET /api/v1/crm/activity`)
- dashboard summary (`GET /api/v1/crm/dashboard/summary`)

Core-aligned scope:

- notifications remain a core concern and should be integrated from `core.notification`
- attachments remain a core concern and should reuse `core.attachment`
- invites and onboarding stay in core because they are tenant lifecycle workflows, not CRM records

Deferred to CRM V2:

- campaigns
- conversations
- advanced attachments and richer document flows
- chatbot

## CRM V1 Implementation Notes

Implemented backend domains:

- `modules.crm.company`
- `modules.crm.contact`
- `modules.crm.lead`
- `modules.crm.pipeline`
- `modules.crm.deal`
- `modules.crm.task`
- `modules.crm.note`
- `modules.crm.activity`
- `modules.crm.dashboard`

Common guarantees across CRM V1:

- true multi-tenancy through mandatory `tenant_id` scoping
- soft delete on CRM entities
- audit trail integration
- standard paginated list contract
- granular permissions with `@RequirePermission`
- tenant isolation in read/write validation

Main V1 permissions:

- `crm.company.read|create|update|delete`
- `crm.contact.read|create|update|delete`
- `crm.lead.read|create|update|delete`
- `crm.deal.read|create|update|delete`
- `crm.pipeline.read|create|update|delete`
- `crm.task.read|create|update|delete`
- `crm.note.read|create|update|delete`
- `crm.activity.read`
- `crm.dashboard.read`

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
- `V18__crm_companies_pipeline_deals.sql`
- `V19__crm_tasks_notes_activity.sql`
- `V20__crm_permissions_seed.sql`

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
- CRM companies/contacts/leads/deals/pipeline/tasks/notes CRUD
- CRM dashboard summary and activity feed
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
