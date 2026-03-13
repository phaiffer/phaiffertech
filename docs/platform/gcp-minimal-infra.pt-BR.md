# GCP Infra Minima Segura

## Objetivo

Preparar a base correta para colocar a plataforma online na GCP sem repetir a arquitetura antiga de VM unica com tudo misturado.

## Etapa 1. Diagnostico do deploy atual

### O que existe hoje

- `apps/backend/Dockerfile`: imagem multi-stage Spring Boot pronta para container.
- `apps/frontend/Dockerfile`: imagem Next.js `standalone`, adequada para Cloud Run depois de exigir `NEXT_PUBLIC_API_URL`.
- `docker-compose.yml`: stack local com PostgreSQL, backend, frontend e ferramentas auxiliares.
- `docker-compose.prod.yml`: stack "producao" baseada em `caddy + frontend + backend + postgres` em containers.
- `Caddyfile`: proxy reverso para `app.phaiffertech.com.br` e `api.phaiffertech.com.br`.
- `infra/terraform`: base legada/inconsistente, com README falando em OCI e recursos reais em GCP.
- `application-prod.yml`: perfil de producao com docs/observabilidade publicas desabilitadas e segredos obrigatorios.

### O que e reutilizavel

- Dockerfiles de backend e frontend.
- Perfil `prod` do backend.
- Health checks (`/actuator/health` e `/api/v1/health`).
- Validacao de producao no backend.
- Estrategia atual de frontend e backend separados.
- CI atual para build/test como validacao de codigo.

### O que nao deve ser usado como base final

- `infra/terraform` legado com `google_compute_instance` e PostgreSQL em container.
- `docker-compose.prod.yml` como arquitetura online final.
- `Caddyfile` como terminacao TLS/entrada principal em producao GCP.
- `.env.production` como fonte final de segredo real.

### Riscos atuais para deploy publico

- banco em container dentro de VM
- segredos operacionais ainda orbitando em env file
- fallback do frontend para `localhost` no build de producao
- CORS de producao aceitando lista comma-separated como um unico item
- backend usando `remoteAddr`, inadequado atras de proxy/serverless
- ausencia de fluxo padrao para Artifact Registry, Secret Manager e Cloud SQL

## Etapa 2. Base inicial GCP definida

### Componentes escolhidos

- Artifact Registry para imagens Docker.
- Cloud Run para backend.
- Cloud Run para frontend.
- Cloud SQL for PostgreSQL para banco gerenciado.
- Secret Manager para segredos de runtime.
- service accounts dedicadas com IAM minimo.

### Por que essa e a menor arquitetura segura

- remove VM e remove PostgreSQL em container
- usa runtime serverless simples e operacionalmente leve
- evita VPC/connector sem necessidade porque o backend usa Cloud SQL Java Connector com `ipTypes=PUBLIC`
- separa imagens, runtime, banco e segredos sem entrar em GKE, mesh, proxy dedicado ou CI/CD complexo

### O que foi propositalmente deixado fora agora

- GKE
- VPC privada e Serverless VPC Access
- load balancer
- CI/CD de deploy
- WAF e componentes de edge adicionais
- backend privado via LB interno

Esses itens podem entrar depois sem retrabalho estrutural, mas nao sao o minimo correto para colocar a stack online agora.

## Etapa 3. Ajustes minimos no projeto

### Ajustes aplicados

- backend passou a aceitar `PORT` alem de `SERVER_PORT`, alinhando com Cloud Run
- backend recebeu dependencia `com.google.cloud.sql:postgres-socket-factory`
- backend passou a resolver IP real por `X-Forwarded-For` / `X-Real-Ip`
- configuracao de CORS agora aceita lista comma-separated corretamente
- perfil `prod` recebeu pool JDBC explicito e mais conservador
- frontend passou a falhar em build de producao sem `NEXT_PUBLIC_API_URL`

### Arquivos principais alterados

- [pom.xml](/home/willian/IdeaProjects/phaiffertech/apps/backend/pom.xml)
- [application.yml](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/application.yml)
- [application-prod.yml](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/resources/application-prod.yml)
- [ClientIpResolver.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/shared/web/ClientIpResolver.java)
- [AuthController.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/core/auth/controller/AuthController.java)
- [ApiRateLimitFilter.java](/home/willian/IdeaProjects/phaiffertech/apps/backend/src/main/java/com/phaiffertech/platform/shared/ratelimit/ApiRateLimitFilter.java)
- [http.ts](/home/willian/IdeaProjects/phaiffertech/apps/frontend/src/shared/lib/http.ts)
- [Dockerfile](/home/willian/IdeaProjects/phaiffertech/apps/frontend/Dockerfile)

## Etapa 4. Infra como codigo

### Base nova criada

- [README.md](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/README.md)
- [versions.tf](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/versions.tf)
- [variables.tf](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/variables.tf)
- [cloud_sql.tf](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/cloud_sql.tf)
- [secret_manager.tf](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/secret_manager.tf)
- [cloud_run.tf](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/cloud_run.tf)
- [outputs.tf](/home/willian/IdeaProjects/phaiffertech/infra/gcp/terraform/outputs.tf)

### Recursos provisionados por essa base

- APIs necessarias do projeto
- repositorio Docker privado no Artifact Registry
- Cloud SQL PostgreSQL com backup e PITR
- database da aplicacao
- secrets do runtime
- service accounts dedicadas
- IAM minimo para backend acessar Cloud SQL e Secret Manager
- Cloud Run backend e frontend, ativados em fases por variaveis

## Etapa 5. Segredos e variaveis

### Segredos

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_DEMO_ASSISTED_USER_PASSWORD` quando demo assistida estiver ativa
- `APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD` quando bootstrap temporario estiver ativo

### Configuracao publica

- `NEXT_PUBLIC_API_URL`

### Configuracao operacional nao sensivel

- `SPRING_PROFILES_ACTIVE=prod`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_SECURITY_PUBLIC_DOCS_ENABLED=false`
- `APP_SECURITY_PUBLIC_OBSERVABILITY_ENABLED=false`
- `APP_SECURITY_JWT_ISSUER`
- `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE`
- `APP_DEMO_ASSISTED_ENABLED`
- `APP_DEMO_ASSISTED_TENANT_CODE`
- `APP_DEMO_ASSISTED_USER_EMAIL`
- `APP_DEMO_ASSISTED_FEATURE_FLAG_KEY`
- `APP_DEMO_ASSISTED_ENFORCE_FEATURE_FLAG`
- `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED`
- `APP_BOOTSTRAP_MASTER_ADMIN_TENANT_CODE`
- `APP_BOOTSTRAP_MASTER_ADMIN_TENANT_NAME`
- `APP_BOOTSTRAP_MASTER_ADMIN_EMAIL`
- `APP_BOOTSTRAP_MASTER_ADMIN_FULL_NAME`

### Variaveis obrigatorias para producao

- backend: datasource url, username, password, JWT secret, CORS allowed origins
- frontend: `NEXT_PUBLIC_API_URL`

## Etapa 6. Sequencia objetiva para o primeiro deploy

### 1. Provisionar a base

```bash
cd infra/gcp/terraform
cp terraform.tfvars.example terraform.tfvars.local
terraform init
terraform apply -var-file=terraform.tfvars.local
```

Com `deploy_backend_service=false` e `deploy_frontend_service=false`.

### 2. Capturar os outputs operacionais

```bash
AR_REPO=$(terraform output -raw artifact_registry_repository_url)
DB_INSTANCE=$(terraform output -raw cloud_sql_instance_name)
DB_CONN=$(terraform output -raw cloud_sql_connection_name)
```

### 3. Criar segredos reais

Exemplo de geracao local segura:

```bash
DB_USER=platform_app
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
SPRING_DATASOURCE_URL="jdbc:postgresql:///platform_prod_db?socketFactory=com.google.cloud.sql.postgres.SocketFactory&cloudSqlInstance=${DB_CONN}&ipTypes=PUBLIC&cloudSqlRefreshStrategy=lazy"
```

Publicar no Secret Manager:

```bash
printf '%s' "$SPRING_DATASOURCE_URL" | gcloud secrets versions add phaiffertech-prod-spring-datasource-url --data-file=-
printf '%s' "$DB_USER" | gcloud secrets versions add phaiffertech-prod-spring-datasource-username --data-file=-
printf '%s' "$DB_PASSWORD" | gcloud secrets versions add phaiffertech-prod-spring-datasource-password --data-file=-
printf '%s' "$JWT_SECRET" | gcloud secrets versions add phaiffertech-prod-app-security-jwt-secret --data-file=-
```

### 4. Configurar o usuario do PostgreSQL

```bash
gcloud sql users create "$DB_USER" --instance "$DB_INSTANCE" --password "$DB_PASSWORD"
```

### 5. Build e push do backend

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
BACKEND_TAG=$(git rev-parse --short HEAD)
docker build -f apps/backend/Dockerfile -t "${AR_REPO}/backend:${BACKEND_TAG}" .
docker push "${AR_REPO}/backend:${BACKEND_TAG}"
```

### 6. Deploy do backend

Idealmente defina o dominio final do frontend antes desta etapa para evitar ida e volta de CORS.

```bash
terraform apply \
  -var-file=terraform.tfvars.local \
  -var="deploy_backend_service=true" \
  -var="backend_image=${AR_REPO}/backend:${BACKEND_TAG}" \
  -var="allowed_cors_origins=https://app.seu-dominio.com"
```

### 7. Build e push do frontend

Com dominio final da API:

```bash
FRONTEND_TAG=$(git rev-parse --short HEAD)
docker build \
  -f apps/frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="https://api.seu-dominio.com/api/v1" \
  -t "${AR_REPO}/frontend:${FRONTEND_TAG}" \
  .
docker push "${AR_REPO}/frontend:${FRONTEND_TAG}"
```

Sem dominio final ainda, use temporariamente `$(terraform output -raw backend_service_url)/api/v1`, publique o frontend e reaplique o backend com o `frontend_service_url` real em `allowed_cors_origins`.

### 8. Deploy do frontend

```bash
terraform apply \
  -var-file=terraform.tfvars.local \
  -var="deploy_backend_service=true" \
  -var="deploy_frontend_service=true" \
  -var="backend_image=${AR_REPO}/backend:${BACKEND_TAG}" \
  -var="frontend_image=${AR_REPO}/frontend:${FRONTEND_TAG}" \
  -var="allowed_cors_origins=https://app.seu-dominio.com"
```

## Etapa 7. Dominio, TLS e exposicao

### Estado desta etapa

- frontend e backend ficam prontos para HTTPS nativo do Cloud Run
- a base de runtime e seguranca esta pronta
- o mapeamento final de dominio/TLS ainda depende da decisao de entrada externa

### O que falta para fechar dominio final corretamente

1. Definir `app.<dominio>` e `api.<dominio>`.
2. Escolher a estrategia de entrada:
   - recomendada: um unico Global External Application Load Balancer com serverless NEG para frontend e backend
   - alternativa provisoria: Cloud Run domain mapping, aceitando a limitacao de preview
3. Configurar DNS para os dois hosts.
4. Rebuild do frontend com `NEXT_PUBLIC_API_URL=https://api.<dominio>/api/v1`.
5. Reaplicar backend com `APP_CORS_ALLOWED_ORIGINS=https://app.<dominio>`.

### Exposicao resultante

- frontend publico em HTTPS
- backend publico em HTTPS apenas porque o navegador chama a API diretamente
- docs e observabilidade publicas ficam desativadas em `prod`
- banco nao fica publico para a internet
- secrets nao ficam em arquivo versionado
