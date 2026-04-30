# Local Windows Development Without Docker

This workflow runs PostgreSQL, the Spring Boot backend, and the Next.js frontend directly on Windows. Docker Compose remains available for Linux validation and production-like testing.

## Current Inventory

What already works locally:

- Backend datasource defaults already target local PostgreSQL at `jdbc:postgresql://localhost:5432/platform_db`.
- Backend default credentials already match `platform_user` / `platform_pass`.
- The `dev` Spring profile seeds `admin@local.test` with password `Admin@123`.
- `admin@local.test` keeps unrestricted local administrator access only when the `dev` profile is active.
- Frontend development builds default to `http://localhost:8080/api/v1` when `NEXT_PUBLIC_API_URL` is not set.

What is Docker-dependent today:

- `docker-compose.yml` provisions PostgreSQL, MailHog, backend, frontend, Adminer, Prometheus, Loki, and Grafana.
- Make targets such as `make up`, `make db-shell`, `make crm-seed`, `make pet-seed`, and observability targets expect Docker.
- Backend integration tests use Testcontainers and still require Docker.

What this local flow adds:

- Root `.env.local.example` for non-Docker backend/frontend environment values.
- Frontend `apps/frontend/.env.local.example` for developers who prefer Next.js local env files.
- PowerShell helpers for starting backend, frontend, and smoke validation on Windows.
- Repeatable setup instructions for local PostgreSQL and local app processes.

Future work:

- Native Windows equivalents for Docker-only seed scripts.
- Optional local MailHog replacement instructions.
- Non-Docker integration test strategy. The current integration suite intentionally remains Testcontainers-based.

## Required Tools

- Java 21.
- Maven 3.9 or newer.
- Node.js 22 LTS, with npm from the Node installation.
- PostgreSQL 16.
- PowerShell 7 or Windows PowerShell 5.1.

Verify the tools:

```powershell
java -version
mvn -version
node -v
npm -v
psql --version
```

## PostgreSQL

Create the local database and user manually:

```sql
CREATE USER platform_user WITH PASSWORD 'platform_pass';
CREATE DATABASE platform_db OWNER platform_user;
GRANT ALL PRIVILEGES ON DATABASE platform_db TO platform_user;
```

Quick connection check:

```powershell
$env:PGPASSWORD = "platform_pass"
psql -h localhost -p 5432 -U platform_user -d platform_db -c "select current_database(), current_user;"
```

## Environment Files

Copy the root local example:

```powershell
Copy-Item .env.local.example .env.local
```

Optional frontend-only env file:

```powershell
Copy-Item apps/frontend/.env.local.example apps/frontend/.env.local
```

The root `.env.local` is loaded by the PowerShell helper scripts. Docker Compose still uses `.env` / `.env.example` as before.

Important local credentials:

- Tenant: `default`
- Email: `admin@local.test`
- Password: `Admin@123`

Keep `SPRING_PROFILES_ACTIVE=dev` for local validation. The unrestricted `admin@local.test` behavior is intentionally tied to that profile.

## Install Dependencies

Backend dependencies:

```powershell
Set-Location apps/backend
mvn -DskipTests dependency:go-offline
Set-Location ../..
```

Frontend dependencies:

```powershell
Set-Location apps/frontend
npm install
Set-Location ../..
```

## Start Backend

From the repo root:

```powershell
.\scripts\start-local-backend.ps1
```

The backend listens on `http://localhost:8080` by default.

Useful endpoints:

- `http://localhost:8080/api/v1/health`
- `http://localhost:8080/actuator/health/readiness`
- `http://localhost:8080/swagger-ui.html`

## Start Frontend

Open another PowerShell window from the repo root:

```powershell
.\scripts\start-local-frontend.ps1
```

The frontend listens on `http://localhost:3000` and calls `http://localhost:8080/api/v1`.

## Smoke Validation

After both processes are running:

```powershell
.\scripts\smoke-local.ps1
```

Then sign in at `http://localhost:3000/login` with:

- Email: `admin@local.test`
- Password: `Admin@123`

## Docker Validation Remains Available

Linux and production-like validation still use the existing Docker flow:

```bash
cp .env.example .env
make up
make smoke
make down
```

Do not remove Docker Compose or Testcontainers support. They remain the validation path for Linux and integration coverage.
