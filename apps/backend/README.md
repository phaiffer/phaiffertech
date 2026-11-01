# Backend, API da Plataforma

API REST Spring Boot da plataforma Gestão Pet. A visão de arquitetura (módulos, multi-tenancy, segurança, pagamentos e mensageria) está em [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md); este README cobre o dia a dia de desenvolvimento.

## Stack

- Java 21, Maven
- Spring Boot 3.5 (Web, Security, Data JPA, Validation, Actuator)
- PostgreSQL 16 + Flyway
- JWT com RBAC e permissões granulares
- Springdoc OpenAPI (Swagger UI)
- Micrometer + Prometheus + ponte OpenTelemetry
- Bucket4j (rate limiting)
- JUnit 5 + Testcontainers

Pacote raiz: `com.phaiffertech.platform`, dividido em `shared`, `core`, `modules` (`pet`, `crm`) e `infrastructure`.

## Como rodar

No Windows, a partir da raiz do monorepo:

```powershell
.\scripts\start-local-backend.ps1
```

O script carrega `.env.local` quando existe e usa por padrão:

- `SPRING_PROFILES_ACTIVE=dev`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/platform_db`
- `SPRING_DATASOURCE_USERNAME=platform_user`

Diretamente com Maven:

```bash
mvn spring-boot:run
```

Com Docker, use `make up` na raiz.

API em `http://localhost:8080/api/v1`. A referência completa dos endpoints está no Swagger UI: `http://localhost:8080/swagger-ui.html`.

## Dados do profile `dev`

| Origem | Tenant | Usuário | Senha |
| --- | --- | --- | --- |
| `infrastructure.persistence.DevelopmentDataSeeder` | `default` | `admin@local.test` | `Admin@123` |
| `infrastructure.demo.DemoCommercialEnvironmentService` (com `APP_DEMO_COMMERCIAL_ENABLED=true`, padrão no `dev`) | `phaiffertech-demo` | `demo@phaiffertech.local` | `Demo@123` |

`admin@local.test` tem acesso irrestrito apenas com o profile `dev` ativo. O tenant de demo recebe clientes, pets, serviços, planos, atendimentos e faturas de banho e tosa. Detalhes em [docs/platform/demo-commercial-environment.en.md](../../docs/platform/demo-commercial-environment.en.md).

## Migrações

- Ficam em `src/main/resources/db/migration` e rodam automaticamente no boot.
- Uma migração publicada **nunca** é editada; qualquer correção entra como nova versão `V<n+1>__descricao.sql`.
- Migrações antigas de um módulo de IoT já removido continuam na cadeia para não quebrar bancos existentes.

## Testes

```bash
mvn test                              # unitários e integração
mvn -Dtest='*IntegrationTest' test    # apenas integração
mvn clean verify                      # o mesmo que o CI
```

- Os testes de integração usam Testcontainers com PostgreSQL real e **exigem Docker**.
- Classes base: `src/test/java/com/phaiffertech/platform/support/IntegrationTestContainersConfig.java` e `AbstractIntegrationTest.java`.
- O bootstrap define `api.version=1.44` para o Docker; sobrescreva com `DOCKER_API_VERSION` se necessário.
- O Jackson está configurado com `non_null`: campos nulos são omitidos do JSON. Em testes de resposta, verifique a ausência do campo em vez de esperar `null`.

## Endpoints operacionais

| Endpoint | Uso |
| --- | --- |
| `GET /actuator/health` | Saúde (banco e estado das migrações) |
| `GET /actuator/prometheus` | Métricas para Prometheus |
| `GET /api/v1/modules` | Módulos do tenant: `moduleEnabled`, `featureFlagEnabled` e `available` (valor final usado pelo frontend) |
| `GET /api/v1/dashboard/summary` | Painel agregado da plataforma |
| `GET /api/v1/pet/dashboard/summary` | Painel operacional do Gestão Pet |

## Convenções

- Todo endpoint de negócio exige `@RequirePermission` com a permissão do recurso (por exemplo, `pet.invoice.update`).
- Consultas de negócio sempre filtram pelo tenant do contexto; prefira as classes de `shared.crud` para CRUDs simples.
- `core` e `shared` não importam `modules.*`, e um módulo vertical não importa outro. Integrações entre módulos passam por contratos em `shared.contracts`.
- Exclusões são lógicas (`deleted_at`).
- Mensagens de erro da API são em inglês; o frontend traduz para pt-BR com seus próprios textos.
