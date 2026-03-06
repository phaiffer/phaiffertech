# Platform Architecture

## Overview

The project is implemented as a **Modular Monolith** with multi-tenancy from day one.

Key principles:
- Single database + shared schema
- `tenant_id` on business tables
- JWT authentication + RBAC authorization
- Domain-oriented package boundaries
- Incremental Flyway migrations

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
│   ├── response
│   ├── security
│   ├── tenancy
│   └── util
├── core
│   ├── auth
│   │   ├── controller
│   │   ├── dto
│   │   ├── mapper
│   │   ├── repository
│   │   └── service
│   ├── tenant
│   │   ├── controller
│   │   ├── dto
│   │   ├── domain
│   │   ├── mapper
│   │   ├── repository
│   │   └── service
│   ├── user
│   │   ├── controller
│   │   ├── dto
│   │   ├── domain
│   │   ├── mapper
│   │   ├── repository
│   │   └── service
│   ├── iam
│   │   ├── controller
│   │   ├── dto
│   │   ├── domain
│   │   ├── mapper
│   │   ├── repository
│   │   └── service
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
│   │   ├── company
│   │   ├── deal
│   │   ├── pipeline
│   │   ├── task
│   │   ├── note
│   │   └── campaign
│   ├── pet
│   │   ├── client
│   │   ├── petprofile
│   │   ├── appointment
│   │   ├── servicecatalog
│   │   ├── product
│   │   ├── inventory
│   │   ├── invoice
│   │   ├── subscription
│   │   └── portal
│   └── iot
│       ├── device
│       ├── telemetry
│       ├── alarm
│       ├── sensor
│       ├── maintenance
│       ├── report
│       ├── monitoring
│       └── ingestion
└── infrastructure
    ├── docs
    ├── persistence
    └── web
```

## Multi-Tenancy

- Context holder: `TenantContext`
- Request filter: `TenantContextFilter`
- Tenant config: `TenantProperties`
- Enforced by tenant-scoped repositories and request validation

## Security

- Access token: JWT
- Refresh token: persistent table with revocation support
- Roles:
  - `PLATFORM_ADMIN`
  - `TENANT_OWNER`
  - `TENANT_ADMIN`
  - `MANAGER`
  - `OPERATOR`
  - `VIEWER`
  - `CUSTOMER_PORTAL_USER`

## Migration Strategy

To preserve Flyway compatibility with already initialized environments:
- Existing `V1__init_schema.sql` was preserved.
- New migrations are incremental:
  - `V2__init_crm_schema.sql`
  - `V3__init_pet_schema.sql`
  - `V4__init_iot_schema.sql`
  - `V5__seed_reference_data.sql`

## Docker and Makefile

`docker-compose.yml` runs:
- `mysql`
- `backend`
- `frontend`
- `adminer` (optional profile `tools`)

Root `Makefile` standardizes local operations for run/build/test/lint/migrate/logs.
