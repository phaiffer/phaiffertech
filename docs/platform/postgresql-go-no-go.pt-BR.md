# Go/No-Go de Homologação e Produção

## Contexto

- projeto: Phaiffer Platform
- tema: migração completa da camada de persistência para PostgreSQL
- commit de referência: `9521062`
- documento complementar: [postgresql-migration-runbook.pt-BR.md](/home/willian/IdeaProjects/phaiffertech/docs/platform/postgresql-migration-runbook.pt-BR.md)

## Resumo Executivo

Status recomendado:

- homologação: `GO controlado`
- produção: `NO-GO até concluir dry-run com dados reais e reconciliação pós-carga`

Conclusão objetiva:

- não há erro crítico claro no código migrado que bloqueie a homologação
- backend, migrations, entidades, repositórios, Docker, Makefile, Terraform e documentação estão coerentes com PostgreSQL
- a suíte automatizada conhecida fechou verde no estado atual
- o principal risco remanescente não é de compilação nem de boot, e sim de comportamento/performance com dados reais importados do MySQL legado

## Evidências de Validação

Validações executadas no estado atual:

- backend: `mvn test` com `71/71` testes passando
- frontend: `npm run lint` sem erros
- frontend: `npx tsc --noEmit` sem erros
- Docker Compose: `docker compose config -q` sem erro
- backend via Compose: subida validada com PostgreSQL e `/actuator/health` retornando `UP`
- Terraform: `terraform init -backend=false && terraform validate` sem erro

Evidências funcionais mais relevantes:

- migrations Flyway executam do zero até a versão atual
- datasource e dependências do backend apontam para PostgreSQL
- Testcontainers foi migrado para PostgreSQL
- pipeline de telemetria resolve para `PostgresTelemetryStore`

## Decisão Formal

### Homologação

Decisão recomendada: `GO`

Condições:

- executar a homologação com ambiente PostgreSQL novo
- repetir os fluxos críticos por módulo com massa controlada
- executar ao menos uma carga de amostra de dados reais do legado
- registrar tempos de resposta e erros SQL durante a bateria

### Produção

Decisão recomendada: `NO-GO` no estado atual para corte definitivo

Condições mínimas para virar `GO`:

- concluir dry-run de migração de dados MySQL -> PostgreSQL
- reconciliar contagens e amostras funcionais por tenant
- validar performance de consultas críticas com base representativa
- validar rollback operacional em ambiente próximo de produção
- validar o blueprint Terraform no tenancy alvo

## Revisão por Área

### Backend e Configuração

- dependências JDBC/Flyway/Testcontainers foram trocadas para PostgreSQL
- `application.yml` aponta para `jdbc:postgresql`
- tipagem de UUID foi normalizada para mapeamento nativo
- buscas textuais foram ajustadas para evitar binds incompatíveis no PostgreSQL

### Migrations

- cadeia Flyway foi portada para PostgreSQL do `V1` ao `V35`
- `pgcrypto` é habilitado no bootstrap inicial
- tipos relevantes foram normalizados para `UUID`, `BOOLEAN` e `TIMESTAMPTZ`
- seeds e inserts de permissões foram adaptados para tipagem explícita quando necessário

### Entities e Repositories

- UUID deixou de depender de `char(36)` em nível de entidade
- filtros com `LOWER/LIKE` passaram a usar padrão compatível com PostgreSQL
- `JdbcTemplate` crítico foi revisado em dashboards e monitoramento
- binds de `Instant` em JDBC foram ajustados para `Timestamp`

### Docker, Env e Make

- `docker-compose.yml` usa `postgres:16`
- `Makefile` foi alinhado com `psql` e com rebuild nos fluxos relevantes
- `.env.example` expõe variáveis `POSTGRES_*`

### Testes

- suíte do backend validada integralmente em PostgreSQL
- frontend validado em lint e tipagem
- cobertura crítica existe para CRM, PET, IoT, autenticação, isolamento multi-tenant e contratos de paginação

### Terraform

- recurso legado de MySQL foi substituído por recurso gerenciado de PostgreSQL em OCI
- validação sintática passou
- ainda falta prova operacional no tenancy real

### Documentação

- README e arquitetura atualizados
- runbook operacional e rollback documentados
- este documento adiciona o gate formal de decisão

## Checklist de Homologação

### Ambiente

- [ ] limpar volumes e subir ambiente do zero com `make up`
- [ ] confirmar `postgres` saudável e backend acessível
- [ ] validar `/actuator/health`
- [ ] validar `/actuator/metrics`
- [ ] validar `/actuator/prometheus`

### Banco Limpo e Migrations

- [ ] derrubar stack e volume do banco
- [ ] recriar banco vazio
- [ ] subir backend e confirmar execução da cadeia Flyway completa
- [ ] confirmar ausência de migrations pendentes
- [ ] validar criação de índices e constraints principais

### Autenticação e Autorização

- [ ] login com tenant válido
- [ ] refresh token
- [ ] logout e revogação
- [ ] acesso com permissão válida
- [ ] bloqueio sem permissão
- [ ] isolamento entre tenants

### CRM

- [ ] CRUD de companies
- [ ] CRUD de contacts
- [ ] CRUD de leads
- [ ] CRUD de deals
- [ ] CRUD de tasks
- [ ] CRUD de notes
- [ ] CRUD de pipeline stages
- [ ] dashboard CRM
- [ ] filtros, busca, paginação e ordenação

### PET

- [ ] CRUD de clients
- [ ] CRUD de pets
- [ ] CRUD de appointments
- [ ] CRUD de professionals
- [ ] CRUD de services
- [ ] CRUD de medical records
- [ ] CRUD de vaccinations
- [ ] CRUD de prescriptions
- [ ] CRUD de products
- [ ] movimentação de inventory
- [ ] invoices
- [ ] dashboard PET

### IoT

- [ ] CRUD de devices
- [ ] CRUD de registers
- [ ] ingestão de telemetry
- [ ] leitura e filtros de telemetry
- [ ] CRUD de alarms
- [ ] acknowledge de alarms
- [ ] CRUD de maintenance
- [ ] dashboards e relatórios IoT
- [ ] buscas, filtros, paginação e ordenação

### Seeds e Massa Mínima

- [ ] executar `make crm-seed`
- [ ] executar `make pet-seed`
- [ ] executar `make iot-seed`
- [ ] validar integridade mínima da massa carregada

### Dados Reais

- [ ] importar amostra real do MySQL legado em ambiente isolado
- [ ] reconciliar contagem por tabela
- [ ] reconciliar contagem por tenant
- [ ] validar amostras funcionais por módulo
- [ ] revisar logs de erro e warnings SQL

## Checklist de Produção

- [ ] congelar escrita no MySQL legado
- [ ] gerar backup consistente e restaurável
- [ ] provisionar PostgreSQL alvo
- [ ] validar extensão `pgcrypto`
- [ ] validar conectividade, rede, credenciais e storage
- [ ] publicar versão migrada do backend
- [ ] executar Flyway em banco vazio
- [ ] carregar dados legados
- [ ] reconciliar contagem e amostras de negócio
- [ ] validar smoke tests de autenticação, CRM, PET e IoT
- [ ] validar healthcheck, métricas e logs
- [ ] monitorar latência, locks e erros SQL após o corte
- [ ] manter rollback pronto até aceite formal
- [ ] formalizar decisão de desligamento do legado só após reconciliação final

## Checklist de Migração de Dados MySQL -> PostgreSQL

### Export

- [ ] congelar escrita da aplicação
- [ ] gerar snapshot ou dump consistente
- [ ] registrar versão do schema de origem
- [ ] registrar janela temporal da extração

### Transformação

- [ ] mapear UUID textual legado para `UUID`
- [ ] mapear boolean legado para `BOOLEAN`
- [ ] mapear timestamps para `TIMESTAMPTZ`
- [ ] revisar enums livres e estados textuais
- [ ] revisar colunas nulas que agora possuem constraint

### Saneamento

- [ ] identificar UUID inválido
- [ ] identificar FK órfã
- [ ] identificar datas inválidas
- [ ] identificar boolean fora de `0/1`
- [ ] identificar strings vazias incompatíveis com regras novas

### Import

- [ ] criar schema com Flyway antes da carga
- [ ] usar `pgloader` ou pipeline equivalente
- [ ] popular tabelas existentes, sem recriação manual do schema
- [ ] registrar volume e duração da carga

### Validação Pós-Carga

- [ ] reconciliar contagem por tabela
- [ ] reconciliar contagem por tenant
- [ ] validar permissions, roles, user_tenants e user_tenant_roles
- [ ] validar dashboards e agregações
- [ ] validar amostras reais de CRM, PET e IoT
- [ ] validar logs de erro de integridade e cast

### Rollback

- [ ] abortar o corte se reconciliação falhar
- [ ] parar a aplicação
- [ ] restaurar código/configuração anterior
- [ ] reapontar para MySQL legado
- [ ] restaurar backup se houver escrita após o freeze
- [ ] validar smoke tests no ambiente revertido

## Riscos Remanescentes

### Queries Nativas

- risco: diferenças sutis de plano de execução e tipagem no PostgreSQL
- foco: repositórios com `nativeQuery = true`, dashboards e monitoramento com `JdbcTemplate`

### JdbcTemplate

- risco: binds de `UUID` e `Instant` fora do padrão podem reaparecer em casos não cobertos
- foco: [CrmDashboardRepository.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/modules/crm/dashboard/repository/CrmDashboardRepository.java) e [IotMonitoringRepository.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/modules/iot/monitoring/repository/IotMonitoringRepository.java)

### UUID

- risco: dados legados com UUID inválido ou inconsistente falham mais cedo no PostgreSQL
- foco: carga de dados e reconciliação

### Boolean e Timestamp

- risco: o PostgreSQL é menos permissivo em coerções implícitas
- foco: massa legada, seeds externas e integrações fora da suíte

### Índices e Performance

- risco: filtros com `LOWER/UPPER` podem degradar em volume alto sem índice funcional
- foco: buscas textuais, dashboards e relatórios

### Constraints e Defaults

- risco: inserts antigos ou scripts externos dependerem de defaults do MySQL ou de ordem de colunas
- foco: scripts auxiliares, cargas legadas e integrações operacionais

## Arquivos Mais Sensíveis para Revisão Manual

- [V1__init_schema.sql](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration/V1__init_schema.sql)
- [V11__crm_pipeline_and_deals.sql](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration/V11__crm_pipeline_and_deals.sql)
- [V18__crm_companies_pipeline_deals.sql](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration/V18__crm_companies_pipeline_deals.sql)
- [V19__crm_tasks_notes_activity.sql](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration/V19__crm_tasks_notes_activity.sql)
- [V21__iot_devices_registers.sql](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration/V21__iot_devices_registers.sql)
- [V22__iot_telemetry_alarms.sql](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration/V22__iot_telemetry_alarms.sql)
- [PostgresTelemetryStore.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/modules/iot/telemetry/service/PostgresTelemetryStore.java)
- [IotMonitoringRepository.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/modules/iot/monitoring/repository/IotMonitoringRepository.java)
- [CrmDashboardRepository.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/modules/crm/dashboard/repository/CrmDashboardRepository.java)
- [docker-compose.yml](/home/willian/IdeaProjects/phaiffertech/docker-compose.yml)
- [Makefile](/home/willian/IdeaProjects/phaiffertech/Makefile)
- [postgresql.tf](/home/willian/IdeaProjects/phaiffertech/infra/terraform/postgresql.tf)
- [postgresql-migration-runbook.pt-BR.md](/home/willian/IdeaProjects/phaiffertech/docs/platform/postgresql-migration-runbook.pt-BR.md)

## Critérios Objetivos de Aprovação

Homologação aprovada:

- suíte automatizada permanece verde
- ambiente sobe do zero
- migrations executam sem intervenção manual obscura
- smoke tests dos módulos principais passam
- amostra real importada não revela erro estrutural

Produção aprovada:

- homologação concluída e assinada
- dry-run de carga real aprovado
- reconciliação validada
- rollback testado
- observabilidade e operação aprovadas pelo time responsável

## Registro de Aprovação

- responsável técnico backend: `________________`
- responsável por dados/migração: `________________`
- responsável por homologação: `________________`
- responsável por infraestrutura: `________________`
- decisão final: `GO / NO-GO`
- data: `____/____/________`
