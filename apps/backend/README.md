# Backend - Platform API

Backend Spring Boot 3.x (Java 21) em arquitetura **Modular Monolith** com base multi-tenant (single database, shared schema).

## Stack

- Java 21
- Spring Boot 3.3.x
- Spring Security (JWT + RBAC)
- Spring Data JPA
- Flyway
- MySQL 8
- Springdoc OpenAPI

## Estrutura principal

```text
src/main/java/com/phaiffertech/platform
├── shared
├── core
├── modules
└── infrastructure
```

## Funcionalidades iniciais

- Multi-tenancy com `TenantContext` e `tenant_id` em entidades de negócio.
- Autenticação com JWT access token + refresh token.
- RBAC inicial com papéis:
  - `PLATFORM_ADMIN`
  - `TENANT_OWNER`
  - `TENANT_ADMIN`
  - `MANAGER`
  - `OPERATOR`
  - `VIEWER`
  - `CUSTOMER_PORTAL_USER`
- Endpoints REST em `/api/v1`.
- Tratamento global de erros.
- OpenAPI/Swagger em `/swagger-ui.html`.
- Seed de desenvolvimento (`dev`) com tenant e usuário admin.

## Usuário de desenvolvimento

Com profile `dev` ativo:

- Tenant: `default`
- E-mail: `admin@local.test`
- Senha: `Admin@123`

## Rodar localmente (sem Docker)

1. Suba MySQL 8 e ajuste variáveis em `application.yml`/env.
2. Execute:

```bash
mvn spring-boot:run
```

## Rodar testes

```bash
mvn test
```
