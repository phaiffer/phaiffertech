# Runbook de PostgreSQL

## Escopo

- banco padrão do projeto: PostgreSQL
- backend: Spring Boot + Spring Data JPA + Flyway
- testes de integração: Testcontainers PostgreSQL
- ambiente local: `docker compose` via `Makefile`

## Variáveis de ambiente

Obrigatórias para o banco:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`

Variáveis operacionais mais comuns:
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `ADMINER_PORT`
- `SPRING_PROFILES_ACTIVE`
- `APP_SECURITY_JWT_SECRET`
- `NEXT_PUBLIC_API_URL`

Defaults de referência estão em:
- [.env.example](/home/willian/IdeaProjects/phaiffertech/.env.example)

## Subir o ambiente

1. Ajuste as variáveis em `.env` se necessário.
2. Suba a stack:

```bash
make up
```

3. Flyway roda automaticamente no boot do backend. Se quiser forçar apenas banco + backend:

```bash
make migrate
```

4. Seeds opcionais de desenvolvimento:

```bash
make crm-seed
make pet-seed
```

5. Shell no banco:

```bash
make db-shell
```

## Ordem das migrations

O backend executa automaticamente todas as migrations Flyway em ordem crescente a partir de:
- [apps/backend/src/main/resources/db/migration](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/db/migration)

Cadeia atual:
- `V1__init_schema.sql` até `V35__tenant_productization_foundation.sql`

Banco novo do zero:
- basta subir `postgres` + `backend`; o schema completo é reconstruído pela cadeia Flyway atual.

## Migração de dados MySQL para PostgreSQL

Roteiro técnico recomendado para uma base MySQL já populada:

1. Congelar escritas na aplicação.
2. Gerar backup consistente do MySQL legado.
3. Provisionar o PostgreSQL novo e executar a cadeia Flyway completa.
4. Migrar dados com ferramenta de carga dedicada, preferencialmente `pgloader`, preservando UUIDs em formato textual e convertendo boolean/timestamp conforme o schema novo.
5. Executar smoke tests dos fluxos críticos antes do corte final.

Exemplo de direção de carga:

```bash
pgloader mysql://USER:PASSWORD@HOST/legacy_db postgresql://USER:PASSWORD@HOST/platform_db
```

Observações:
- as migrations atuais já criam o schema PostgreSQL; a carga deve popular tabelas existentes, não recriá-las
- manter snapshot/backup do MySQL até o aceite final
- validar especialmente `feature_flags`, `rate_limit_policies`, tabelas CRM/PET/IoT e `user_tenant_roles`

## Rollback

Rollback operacional recomendado:

1. Manter snapshot ou dump do MySQL legado antes do corte.
2. Se o corte para PostgreSQL falhar, parar a aplicação.
3. Restaurar a versão anterior do código/configuração que ainda aponta para MySQL.
4. Reapontar variáveis de ambiente para a stack legada.
5. Subir novamente a stack anterior e validar login, tenancy, CRM, PET e IoT.

Limitação importante:
- como a engine padrão do repositório passa a ser PostgreSQL, rollback de código para MySQL depende do commit anterior e do backup preservado do banco legado

## Riscos remanescentes

- diferenças de plano de execução entre MySQL e PostgreSQL podem alterar performance em consultas grandes
- dados legados com valores fora do esperado para `uuid`, boolean ou timestamps precisam saneamento prévio
- o blueprint atual para deploy inicial na GCP fica em `infra/gcp/terraform`; qualquer referencia OCI deve ser tratada apenas como historica
