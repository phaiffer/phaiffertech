# Phaiffer Platform Monorepo

Unified multi-tenant SaaS platform foundation for CRM, Pet and IoT domains.

## Stack

### Backend
- Java 21
- Spring Boot 3.x
- Maven
- Spring Security (JWT + RBAC)
- Spring Data JPA
- Flyway
- MySQL 8
- OpenAPI/Swagger

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Infra
- Docker Compose
- MySQL + Backend + Frontend
- Optional Adminer profile

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

## Backend Package Tree (high level)

```text
com.phaiffertech.platform
├── PlatformApplication
├── shared
├── core
├── modules
└── infrastructure
```

Detailed package organization is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Flyway Strategy

Existing migration `V1__init_schema.sql` was preserved for compatibility with already-initialized environments.

Incremental migrations were added:
- `V2__init_crm_schema.sql`
- `V3__init_pet_schema.sql`
- `V4__init_iot_schema.sql`
- `V5__seed_reference_data.sql`

## Main Endpoints (`/api/v1`)

- `GET /health`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET|POST /tenants`
- `GET|POST /users`
- `GET /modules`
- `GET|POST /crm/contacts`
- `GET|POST /pet/clients`
- `GET|POST /iot/devices`

Swagger UI:
- `http://localhost:8080/swagger-ui.html`

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

Most used:
- `make up`
- `make down`
- `make status`
- `make logs`
- `make build`
- `make test`
- `make lint`
- `make db-shell`
- `make migrate`
- `make seed`

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

1. Add integration tests (auth, tenancy isolation, module endpoints).
2. Expand granular permissions beyond role-level checks.
3. Add CI pipeline gates for Flyway + backend compile + frontend lint/build.
4. Add Terraform modules for OCI environments.
