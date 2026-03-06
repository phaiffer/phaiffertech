# Arquitetura Inicial da Plataforma

## Visão Geral

A solução foi iniciada como **Modular Monolith** com foco em:

- Multi-tenancy desde o primeiro commit
- Segurança centralizada (JWT + RBAC)
- Estrutura organizada para futura extração de serviços
- Baixo acoplamento entre domínios

## Estratégia de Multi-tenancy

- Modelo: **single database + shared schema**
- `tenant_id` em tabelas de negócio
- `TenantContext` por request
- Header suportado: `X-Tenant-Id`
- Controle anti-cross-tenant via filtros + consultas por tenant

## Backend

### Camadas

- `shared`: configuração, segurança, tratamento de erro, resposta padrão
- `core`: auth, tenant, user, iam, module registry, audit e fundamentos
- `modules`: domínios CRM, Pet e IoT
- `infrastructure`: seed e pontos de integração técnica

### Padrões

- REST em `/api/v1`
- DTOs request/response
- Paginação nas listagens
- Flyway para versionamento de banco
- OpenAPI/Swagger

## Frontend

### Estrutura

- `app`: rotas e layouts (público/autenticado)
- `modules`: telas por domínio (crm, pet, iot)
- `shared`: serviços, cliente HTTP, sessão, UI e tipos

### Fluxo de sessão

1. Login com `tenantCode`, `email`, `password`
2. Armazenamento de `accessToken`, `refreshToken` e usuário
3. Envio automático de:
   - `Authorization: Bearer <token>`
   - `X-Tenant-Id: <tenantId>`

## Evolução planejada

- Permissões granulares (ABAC/RBAC híbrido)
- Soft delete consistente por entidade
- Observabilidade avançada (tracing/metrics/logs estruturados)
- Terraform para OCI com ambientes dev/stg/prod
- CI/CD e quality gates (testes, SAST, migrations checks)
