# Gestão Pet, Plataforma PhaifferTech

Plataforma SaaS multi-tenant para pet shops de **banho e tosa**. Cobre clientes, pets, agenda multi-serviço, catálogo de serviços, profissionais e comissões, planos com consumo de sessões, estoque, cobrança e mensagens preparadas para o cliente.

O repositório é um monorepo com backend Java/Spring Boot e frontend Next.js. O produto é exibido como **Gestão Pet** (pt-BR) / **Pet Management** (en-US).

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Java 21, Spring Boot 3, Spring Security (JWT + RBAC + permissões granulares), Spring Data JPA, Flyway, PostgreSQL 16, Springdoc OpenAPI, Micrometer/Prometheus, Testcontainers |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest + Testing Library |
| Infra | Docker Compose, GitHub Actions, Terraform (GCP: Cloud Run, Cloud SQL, Secret Manager, Artifact Registry) |

## Estrutura

```text
.
├── apps/
│   ├── backend/     # API Spring Boot (pacote raiz com.phaiffertech.platform)
│   └── frontend/    # Next.js (painel, telas Gestão Pet e site público)
├── docs/            # Documentação técnica (índice abaixo)
├── infra/           # Docker, Terraform GCP e observabilidade
├── scripts/         # Scripts PowerShell para desenvolvimento local no Windows
├── Makefile
└── docker-compose.yml
```

## Como rodar

### Com Docker

```bash
cp .env.example .env
make up
```

### No Windows, sem Docker

Requer PostgreSQL local com o banco `platform_db` (usuário `platform_user`). O passo a passo completo está em [docs/local-windows-development.md](docs/local-windows-development.md).

```powershell
Copy-Item .env.local.example .env.local
.\scripts\start-local-backend.ps1    # janela 1
.\scripts\start-local-frontend.ps1   # janela 2
.\scripts\smoke-local.ps1            # verificação rápida
```

### Endereços

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger UI (referência completa da API) | http://localhost:8080/swagger-ui.html |
| Adminer (profile `tools`) | http://localhost:8081 |
| Prometheus / Grafana (`make observability-up`) | http://localhost:9090 / http://localhost:3001 |

### Acessos locais (profile `dev`)

| Uso | Tenant | E-mail | Senha |
| --- | --- | --- | --- |
| Demo comercial de banho e tosa (dados de exemplo) | `phaiffertech-demo` | `demo@phaiffertech.local` | `Demo@123` |
| Administrador local (acesso irrestrito para validação) | `default` | `admin@local.test` | `Admin@123` |

Essas credenciais existem apenas no profile `dev` e podem ser sobrescritas por variáveis `APP_DEMO_COMMERCIAL_*`. Ambientes publicados usam segredos próprios (ver [docs/platform/demo-sysadmin-secrets-hardening.pt-BR.md](docs/platform/demo-sysadmin-secrets-hardening.pt-BR.md)).

## Comandos úteis

```bash
make help              # lista todos os alvos
make test              # testes do backend
make test-integration  # testes de integração (Testcontainers + PostgreSQL)
make verify            # build + testes
make logs-follow       # logs do Docker Compose
```

Frontend (em `apps/frontend`):

```bash
npm test        # Vitest
npm run lint
npm run build
```

O CI (`.github/workflows/ci.yml`) executa `mvn clean verify` no backend e `npm ci && npm test && npm run lint && npm run build` no frontend a cada PR.

## Documentação

| Tema | Documento |
| --- | --- |
| Arquitetura (módulos, multi-tenancy, segurança, pagamentos, mensageria, i18n) | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Modelo de domínio de banho e tosa | [docs/domain/grooming-domain.md](docs/domain/grooming-domain.md) |
| Camada de pagamentos | [visão geral](docs/payments/payment-layer-overview.md), [modelo de domínio](docs/payments/payment-domain-model.md), [roadmap](docs/payments/payment-roadmap.md) |
| Backend | [apps/backend/README.md](apps/backend/README.md) |
| Frontend e i18n | [apps/frontend/README.md](apps/frontend/README.md) |
| Desenvolvimento local no Windows | [docs/local-windows-development.md](docs/local-windows-development.md) |
| Operação, deploy e infraestrutura GCP | [docs/platform/](docs/platform/) |
| Validação manual da demo | [docs/validation/manual-validation-checklist.md](docs/validation/manual-validation-checklist.md) |
| Decisões e roadmap do projeto | [docs/tcc/](docs/tcc/) |

## Limitações conhecidas

- O envio oficial via WhatsApp Cloud API tem fundação técnica no código, mas não está validado; a demo usa mensagens preparadas para envio manual.
- Não há gateway de pagamento integrado (PIX dinâmico ou cartão). A cobrança é manual assistida, com providers `Manual` e `Noop` atrás de uma interface.
- As telas de CRM, clínica veterinária e administração da plataforma ainda têm textos fixos em inglês ou português; a internacionalização completa cobre as telas de banho e tosa.
