# Backend - Platform API

Spring Boot backend for the modular multi-tenant SaaS platform.

## Stack

- Java 21
- Spring Boot 3.3.x
- Maven
- Spring Security (JWT + RBAC + granular permissions)
- Spring Data JPA
- Flyway
- MySQL 8
- Springdoc OpenAPI
- Testcontainers (integration tests)

## Package Root

- `com.phaiffertech.platform`

## Key Capabilities

- Multi-tenancy with `TenantContext` and tenant isolation filter.
- Refresh token hashing + rotation + logout revocation.
- Permission annotation `@RequirePermission`.
- Automatic audit logging for auth and CRUD actions.
- Shared pagination (`page`, `size`, `sort`, `search`).
- CRM v1 contacts/leads CRUD.

## Flyway Migrations

- `V1__init_schema.sql`
- `V2__init_crm_schema.sql`
- `V3__init_pet_schema.sql`
- `V4__init_iot_schema.sql`
- `V5__seed_reference_data.sql`
- `V6__seed_permissions.sql`
- `V7__refresh_token_security.sql`
- `V8__crm_extended_schema.sql`

## Development Seed

Reference data and default tenant/admin are seeded by Flyway and reinforced by `DevelopmentDataSeeder` in `dev` profile.

Default credentials:
- Tenant: `default`
- Email: `admin@local.test`
- Password: `Admin@123`

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

Integration tests are under:
- `src/test/java/com/phaiffertech/platform/integration`

They require a Docker-compatible runtime for Testcontainers; otherwise tests are skipped.
