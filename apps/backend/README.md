# Backend - Platform API

Spring Boot backend for the modular multi-tenant SaaS platform.

## Stack

- Java 21
- Spring Boot 3.3.x
- Maven
- Spring Security (JWT + RBAC)
- Spring Data JPA
- Flyway
- MySQL 8
- Springdoc OpenAPI

## Package Root

- `com.phaiffertech.platform`

## Package Structure

```text
com.phaiffertech.platform
├── shared
│   ├── config
│   ├── domain
│   │   ├── base
│   │   └── enums
│   ├── exception
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
│   ├── pet
│   └── iot
└── infrastructure
```

## Flyway Migrations

- `V1__init_schema.sql` (preserved for compatibility)
- `V2__init_crm_schema.sql`
- `V3__init_pet_schema.sql`
- `V4__init_iot_schema.sql`
- `V5__seed_reference_data.sql`

## Development Seed

Reference data and default tenant/admin are seeded by Flyway (`V5`) and reinforced by `DevelopmentDataSeeder` in `dev` profile for local safety.

Default credentials:
- Tenant: `default`
- Email: `admin@local.test`
- Password: `Admin@123`

## Run Locally

```bash
mvn spring-boot:run
```

## Compile and Package

```bash
mvn -DskipTests compile
mvn -DskipTests package
```

## Test

```bash
mvn test
```
