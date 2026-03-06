# Phaiffer Platform Monorepo

Unified multi-tenant SaaS platform (CRM, Pet and IoT) built as a modular monolith.

## Stack

### Backend
- Java 21
- Spring Boot 3.x
- Maven
- Spring Security (JWT + RBAC + granular permissions)
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
- Multi-tenancy with tenant context enforcement and tenant-isolated queries.
- Authorization model with `user_tenants` + `user_tenant_roles` + `role_permissions`.
- JWT access token + secure refresh token (hash + rotation + revoke on logout).
- Granular permission checks via `@RequirePermission`.
- Automatic auditing for auth and CRUD flows.
- Soft delete with `deleted_at` on business entities.
- Standard pagination contract (`page`, `size`, `sort`, `direction`, `search`).
- IoT split between control plane and data plane abstractions.

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

### CRM
- Contacts:
  - `GET|POST /crm/contacts`
  - `GET|PUT|DELETE /crm/contacts/{id}`
  - `PATCH /crm/contacts/{id}/restore`
- Leads:
  - `GET|POST /crm/leads`
  - `GET|PUT|DELETE /crm/leads/{id}`
  - `PATCH /crm/leads/{id}/restore`
- Pipeline/Deal base:
  - `GET|POST /crm/pipelines`
  - `GET|POST /crm/deals`
  - `PUT /crm/deals/{id}`
- Notes/Tasks base:
  - `GET|POST /crm/notes`
  - `GET|POST /crm/tasks`
  - `PUT /crm/tasks/{id}`

### Pet / IoT
- `GET|POST /pet/clients`
- `GET|POST /iot/devices`
- `GET|POST /iot/telemetry`

Swagger UI:
- `http://localhost:8080/swagger-ui.html`

## Frontend

Implemented pages:

- Public/Auth: `/login`
- Core: `/dashboard`, `/tenants`, `/users`, `/settings`
- CRM:
  - `/crm`
  - `/crm/contacts`, `/crm/contacts/new`, `/crm/contacts/[id]`
  - `/crm/leads`, `/crm/leads/new`, `/crm/leads/[id]`
- Modules: `/pet`, `/iot`

Guards:
- Route protection via authenticated layout (`ProtectedRoute`).
- Permission checks via `PermissionGuard` + `usePermissions`.
- Sidebar module visibility based on permissions.

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
- `make logs-follow`, `make logs-backend`, `make logs-frontend`, `make logs-db`
- `make docker-build`, `make docker-reset-db`
- `make test`, `make test-backend`, `make test-integration`, `make test-unit`
- `make build`, `make verify`
- `make migrate`, `make crm-seed`, `make db-shell`

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
- Pet clients create/list
- IoT devices create/list
- IoT telemetry write/read
- pagination contract

Execution:

```bash
make test-integration
# or
cd apps/backend && mvn -Dgroups=integration test
```

Notes:
- Testcontainers + MySQL are mandatory for integration tests.
- Maven is configured to set Docker `api.version=1.44` to support modern Docker daemons with minimum API 1.44.

## Dev Credentials

- Tenant code: `default`
- Email: `admin@local.test`
- Password: `Admin@123`

## Default Ports

- MySQL: `3306`
- Backend: `8080`
- Frontend: `3000`
- Adminer: `8081`
