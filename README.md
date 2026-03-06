# Phaiffer Platform Monorepo

Unified multi-tenant SaaS platform foundation for CRM, Pet and IoT domains.

## Stack

### Backend
- Java 21
- Spring Boot 3.x
- Maven
- Spring Security (JWT + RBAC + granular permissions)
- Spring Data JPA
- Flyway
- MySQL 8
- OpenAPI/Swagger
- Testcontainers (integration tests)

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Infra
- Docker Compose
- MySQL + Backend + Frontend (+ optional Adminer profile)
- Root Makefile for local workflows

## Package Root

Backend package root is fixed as:

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

## Backend Highlights

- Modular monolith (`shared`, `core`, `modules`, `infrastructure`).
- Multi-tenancy with `tenant_id` and `TenantContext` enforcement.
- JWT auth with refresh token hash + rotation + logout revocation.
- Granular permission checks via `@RequirePermission("...")`.
- Automatic audit logs for CRUD/auth events.
- Soft delete support (`deleted_at`) on key business entities.
- Shared pagination contract (`page`, `size`, `sort`, `search`).
- CRM v1 with full Contacts and Leads workflows.

## Flyway Migrations

Current migrations:

- `V1__init_schema.sql`
- `V2__init_crm_schema.sql`
- `V3__init_pet_schema.sql`
- `V4__init_iot_schema.sql`
- `V5__seed_reference_data.sql`
- `V6__seed_permissions.sql`
- `V7__refresh_token_security.sql`
- `V8__crm_extended_schema.sql`

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
- `GET|POST /crm/contacts`
- `GET|PUT|DELETE /crm/contacts/{id}`
- `PATCH /crm/contacts/{id}/restore`
- `GET|POST /crm/leads`
- `PUT|DELETE /crm/leads/{id}`
- `PATCH /crm/leads/{id}/restore`

### Pet / IoT
- `GET|POST /pet/clients`
- `GET|POST /iot/devices`

Swagger UI:
- `http://localhost:8080/swagger-ui.html`

## Frontend Screens

- `/login`
- `/dashboard`
- `/tenants`
- `/users`
- `/crm`
- `/crm/contacts`
- `/crm/leads`
- `/pet`
- `/iot`
- `/settings`

## Quick Start with Docker

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start stack:

```bash
make up
```

3. Access services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Adminer (optional): `http://localhost:8081` (`docker compose --profile tools up -d`)

## Local Development (without Docker)

Backend:

```bash
make backend
```

Frontend:

```bash
make frontend
```

## Makefile Commands

List all commands:

```bash
make help
```

Main commands:
- `make up`
- `make down`
- `make status`
- `make logs-follow`
- `make docker-build`
- `make docker-reset-db`
- `make build`
- `make test-backend`
- `make test-integration`
- `make lint`
- `make migrate`
- `make crm-seed`

## Integration Tests

Integration tests live at:

- `apps/backend/src/test/java/com/phaiffertech/platform/integration`

They use Testcontainers + MySQL. If Docker is unavailable/incompatible, tests are skipped automatically (`@Testcontainers(disabledWithoutDocker = true)`).

## Dev Credentials

- Tenant code: `default`
- Email: `admin@local.test`
- Password: `Admin@123`

## Ports

- MySQL: `3306`
- Backend: `8080`
- Frontend: `3000`
- Adminer: `8081` (optional)

## Next Recommended Steps

1. Add field-level permission policies and admin UI for role-permission management.
2. Add background jobs for refresh token cleanup and audit retention.
3. Add CI pipeline with mandatory integration tests in Docker-capable runners.
4. Expand CRM (pipelines/deals/tasks) following the same module conventions.
