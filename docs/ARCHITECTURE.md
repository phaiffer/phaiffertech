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
│   │   ├── capability
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
│   │   ├── capability
│   │   ├── petprofile
│   │   ├── appointment
│   │   ├── servicecatalog
│   │   ├── professional
│   │   ├── medical
│   │   │   ├── record
│   │   │   ├── vaccination
│   │   │   └── prescription
│   │   ├── product
│   │   ├── inventory
│   │   ├── invoice
│   │   ├── subscription
│   │   └── portal
│   └── iot
│       ├── device
│       ├── capability
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

## Core And Vertical Boundaries

Core owns platform concerns only:
- `core.auth`, `core.tenant`, `core.user`, `core.iam`
- `core.settings`
- `core.audit`, `core.notification`, `core.attachment`
- `core.module` for registry, feature flags, tenant module bindings and aggregated dashboard entrypoints
- `shared.*` for technical infrastructure, shared CRUD primitives and cross-module contracts

Vertical modules own business rules:
- `modules.crm`: companies, contacts, leads, deals, pipeline, tasks, notes, activity and CRM dashboard
- `modules.iot`: devices, registers, telemetry, alarms, maintenance, monitoring and reports
- `modules.pet`: clients, pets, appointments, services, professionals, medical records, vaccinations, prescriptions, products, inventory and invoices

Explicit rule:
- core cannot contain CRM, IoT or Pet business logic
- one vertical module cannot access another vertical module directly
- cross-module reads must happen through contracts/capabilities, not through another module repository

## Architectural Findings

Repository analysis on `2026-03-07` found:

- no direct repository access from CRM to IoT/Pet, from IoT to CRM/Pet, or from Pet to CRM/IoT
- no direct vertical imports inside `core.*`
- one critical leakage existed before this refactor: `shared.health.TelemetryPipelineHealthIndicator` imported IoT telemetry abstractions and therefore mixed vertical behavior into shared/core-like infrastructure
- module enablement already existed in backend, but the registry response did not distinguish tenant module binding from feature flag state, which blurred tenant access rules on the frontend
- there was no central aggregated dashboard contract; any future platform dashboard risked pulling repositories from multiple vertical modules into core

Corrections applied in this stage:

- telemetry pipeline health moved to `modules.iot.monitoring.health`
- `shared.contracts.module` introduced as the explicit cross-module contract package
- `/api/v1/dashboard/summary` introduced as a core aggregation endpoint backed only by capabilities
- `/api/v1/modules` now returns `moduleEnabled`, `featureFlagEnabled` and `available`

## Module Capabilities And Contracts

Cross-module contracts now live in:
- `shared.contracts.module.ModuleSummaryCapability`
- `shared.contracts.module.ModuleSummaryView`
- `shared.contracts.module.ModuleMetricView`

Implemented module capabilities:
- `modules.crm.capability.CrmDashboardCapability`
- `modules.iot.capability.IotDashboardCapability`
- `modules.pet.capability.PetDashboardCapability`

Capability rules:
- the contract exposes summary data only
- core consumes the contract interface, never a vertical repository
- each vertical module keeps ownership of how its summary is built internally

Current pragmatic scope:
- this stage standardizes dashboard/summary aggregation first
- narrower capabilities such as contact summary, device status summary or pet owner summary can be added later only where a real integration needs them

## Module Enablement Model

Three separate concepts now remain explicit:

1. Module enabled
   - tenant condition
   - stored in `tenant_modules`
   - answers: "is this tenant subscribed/allowed to use the module?"
2. Feature flag
   - rollout condition
   - stored in `feature_flags`
   - answers: "should this capability be exposed right now for this tenant?"
3. Permission
   - user/role condition
   - resolved from JWT + `role_permissions`
   - answers: "can this authenticated user perform this action?"

Backend flow:

- `ModuleAccessService` evaluates module availability from tenant binding + feature flag
- `ModuleAccessGuard` blocks `/api/v1/crm/**`, `/api/v1/iot/**` and `/api/v1/pet/**` when unavailable
- `@RequirePermission` still enforces per-endpoint authorization after module access passes

Frontend flow:

- sidebar hides module menus when `available=false`
- route-level `ModuleGuard` blocks `/crm`, `/iot` and `/pet` screens when the module is unavailable
- dashboard shows the difference between tenant binding, feature flag and final availability

## Dashboard Aggregation

Platform-level aggregation is now intentionally thin:

- `PlatformDashboardService` depends on `List<ModuleSummaryCapability>`
- each capability returns a `ModuleSummaryView`
- the core dashboard filters capabilities through `ModuleAccessService`
- the core dashboard does not import vertical repositories or entities

This keeps the platform dashboard extensible without turning `core` into a god service.

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
  - telemetry pipeline indicator, implemented inside `modules.iot.monitoring.health`

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
- PET: clients, profiles, appointments, services, professionals, medical records, vaccinations, prescriptions, products and invoices
- IoT: devices, registers, maintenance and alarms where CRUD is sufficient; telemetry keeps explicit data-plane services

Exception:
- `modules.pet.inventory` keeps an explicit service because stock snapshot recalculation must remain transactional when movements are created, edited, deleted or restored

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
- module availability computed from tenant module binding + feature flag
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

## Legacy PetFlow Functional Summary

The legacy PetFlow at `../petflow` was inspected only as a functional reference. Relevant findings:

- operational domains found in code: clients/tutors, pets, appointments/agenda, products, inventory transactions, subscriptions, finance/invoices, dashboard/reports and client portal endpoints
- clinical and commercial rules found in legacy services:
  - deactivating a client or pet cancels future scheduled appointments
  - appointment flows validate company ownership and active client/pet relations
  - inventory movements cannot drive stock below zero
  - appointments covered by subscription should not be invoiced as regular cash sales
  - client portal booking is restricted to the authenticated client and that client's pets
- important structural limit in the legacy reference:
  - no mature standalone modules were found for service catalog, professionals, medical records, vaccinations or prescriptions
  - those capabilities were therefore modeled natively for the SaaS platform instead of copied from legacy assumptions

## Pet Gap Analysis and Scope

Comparison baseline:

- legacy reference: `../petflow`
- current platform code:
  - `apps/backend/src/main/java/com/phaiffertech/platform/modules/pet`
  - `apps/frontend/src/app/(app)/pet`
  - `apps/frontend/src/modules/pet`

| Funcionalidade | Status na nova plataforma |
| --- | --- |
| clients | já implementado |
| pets | já implementado |
| appointments | já implementado |
| services | já implementado |
| professionals | já implementado |
| medical records | já implementado |
| vaccinations | já implementado |
| prescriptions | já implementado |
| products | já implementado |
| inventory | já implementado |
| invoices | já implementado |
| subscriptions | adiar para Pet V2 |
| notifications / reminders | adiar para Pet V2 |
| reports | adiar para Pet V2 |
| agenda | parcialmente implementado |
| client portal | adiar para Pet V2 |

Status interpretation:

- `já implementado`: backend + frontend tenant-aware CRUD delivered in Pet V1
- `parcialmente implementado`: there is operational coverage, but not at the legacy UX depth yet
- `adiar para Pet V2`: intentionally excluded from the commercial/clinical SaaS baseline for this stage

## Pet V1 Scope

Mandatory clinical scope delivered:

- clients
- pets
- appointments
- services
- professionals
- medical records
- vaccinations
- prescriptions

Commercial V1 delivered:

- products
- inventory
- invoices

Explicitly deferred to Pet V2:

- subscriptions aligned with shared platform billing/governance
- automatic reminders/notifications
- client portal
- advanced reports
- external integrations

## Pet V1 Implementation Notes

Implemented backend domains now in active use:

- `modules.pet.client`
- `modules.pet.petprofile`
- `modules.pet.appointment`
- `modules.pet.servicecatalog`
- `modules.pet.professional`
- `modules.pet.medical.record`
- `modules.pet.medical.vaccination`
- `modules.pet.medical.prescription`
- `modules.pet.product`
- `modules.pet.inventory`
- `modules.pet.invoice`

Main architectural decisions:

- existing core auth, tenant, RBAC and permission layers were reused; no PetFlow auth/user model was ported
- legacy appointment `service_name` history was normalized into `pet_services`, and appointments now reference `service_id`
- professionals, medical records, vaccinations and prescriptions were introduced as first-class tenant entities because the legacy implementation did not provide reusable modular boundaries for them
- inventory is modeled as movement history plus current stock snapshot on product, keeping auditability without breaking the shared CRUD conventions elsewhere
- subscriptions, reminders and client portal remain future work because they depend on broader shared-platform concerns and should not be hard-copied from a standalone product

Main Pet V1 permissions:

- `pet.client.read|create|update|delete`
- `pet.profile.read|create|update|delete`
- `pet.appointment.read|create|update|delete`
- `pet.service.read|create|update|delete`
- `pet.professional.read|create|update|delete`
- `pet.medical-record.read|create|update|delete`
- `pet.vaccination.read|create|update|delete`
- `pet.prescription.read|create|update|delete`
- `pet.product.read|create|update|delete`
- `pet.inventory.read|create|update|delete`
- `pet.invoice.read|create|update|delete`

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
- `V21__iot_devices_registers.sql`
- `V22__iot_telemetry_alarms.sql`
- `V23__iot_maintenance_dashboard_permissions.sql`
- `V24__pet_clients_pets.sql`
- `V25__pet_appointments_services.sql`
- `V26__pet_medical_records.sql`
- `V27__pet_products_inventory_invoices.sql`

Previous migrations were preserved; new changes are strictly incremental.

Important note:

- the requested Pet V1 migrations were introduced as `V24..V27`, not `V17..V20`, because the existing repository already had later Flyway versions allocated and reusing them would break the migration chain

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
- PET services/professionals CRUD
- PET medical records/vaccinations/prescriptions CRUD
- PET products/inventory/invoices CRUD
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
