# Phaiffer Platform Monorepo

Base inicial de uma plataforma SaaS unificada, multi-tenant e modular, construída para consolidar cenários CRM, Pet e IoT.

## Stack

### Backend

- Java 21
- Spring Boot 3.x
- Spring Security (JWT + RBAC)
- Spring Data JPA
- Flyway
- MySQL 8
- OpenAPI/Swagger

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Infra local

- Docker Compose (MySQL + Backend + Frontend)

## Estrutura do monorepo

```text
.
├── apps/
│   ├── backend/
│   └── frontend/
├── docs/
├── infra/
│   ├── docker/
│   └── terraform/
├── .editorconfig
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Arquitetura adotada

- **Modular Monolith** no backend.
- **Multi-tenant** desde o início (single DB/shared schema).
- `tenant_id` em tabelas de negócio.
- Módulos desacoplados em `core` e `modules`.
- Estrutura pronta para evolução e extração futura.

Mais detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Entregáveis implementados nesta fase

- Monorepo inicial completo.
- Backend Spring Boot funcional com segurança JWT.
- Frontend Next.js funcional com login e dashboard.
- Docker Compose com MySQL, backend e frontend.
- Migrations Flyway iniciais.
- Seed dev opcional automatizado.
- Endpoints core + módulos CRM/Pet/IoT.

## Endpoints principais (`/api/v1`)

### Saúde

- `GET /health`

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

### Core

- `GET /tenants`
- `POST /tenants`
- `GET /users`
- `POST /users`
- `GET /modules`

### CRM

- `GET /crm/contacts`
- `POST /crm/contacts`

### Pet

- `GET /pet/clients`
- `POST /pet/clients`

### IoT

- `GET /iot/devices`
- `POST /iot/devices`

## OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Como executar localmente

1. Copie variáveis:

```bash
cp .env.example .env
```

2. Suba os serviços:

```bash
docker compose up --build
```

3. Acesse:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`

## Credenciais dev (profile `dev`)

- Tenant code: `default`
- E-mail: `admin@local.test`
- Senha: `Admin@123`

## Variáveis principais

Definidas em `.env.example`:

- `MYSQL_*`
- `APP_SECURITY_JWT_*`
- `APP_CORS_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_API_URL`

## Próximos passos recomendados

1. Expandir RBAC para permissões finas por recurso.
2. Adicionar testes de integração (auth, tenant isolation, módulos).
3. Implementar observabilidade (logs estruturados, métricas, tracing).
4. Iniciar módulos Terraform para OCI e pipelines CI/CD.
