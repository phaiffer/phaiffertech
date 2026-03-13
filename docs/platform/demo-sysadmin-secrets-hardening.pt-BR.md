# Demo, Sysadmin e Secrets

## Objetivo

Este documento separa explicitamente tres conceitos operacionais que estavam misturados:

- `master tenant` da PhaifferTech
- `sysadmin` operacional da empresa
- `demo comercial assistida`

Tambem define como configurar o projeto com environment variables e secrets no GCP sem expor credenciais no frontend.

## Estado alvo

### Master tenant e sysadmin

- O tenant `PHAIFFER_TECH` e o usuario `sysadmin@phaiffer.tech` representam a operacao real da PhaifferTech.
- Eles nao devem ser usados como demo comercial.
- A migration `V37__setup_master_tenant_phaiffer.sql` cria apenas o bootstrap estrutural:
  - tenant master marcado como `platform_owner`
  - usuario placeholder de sysadmin
  - senha nao operacional e nao reutilizavel
  - vinculo com `PLATFORM_ADMIN`
- A senha operacional passa a ser aplicada fora da migration, por bootstrap/reset controlado por env.

### Demo comercial assistida

- A demo comercial deve usar tenant e usuario proprios.
- O frontend nao conhece e nao preenche credenciais.
- O botao `Usar demo` chama `POST /api/v1/auth/demo-login`.
- O backend executa o login usando secrets do ambiente.
- Em producao, a demo so deve funcionar quando:
  - `APP_DEMO_ASSISTED_ENABLED=true`
  - as credenciais do demo estiverem configuradas
  - a feature flag global `demo.assisted.enabled` estiver ativa

### Dev versus producao

- `admin@local.test` / `Admin@123` continuam sendo apenas seed de desenvolvimento.
- Esse acesso nao deve ser tratado como demo comercial.
- O frontend de producao nao embute mais o fluxo de demo via preenchimento de formulario.

## Variaveis relevantes

### Backend obrigatorias em producao

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

### Demo assistida

- `APP_DEMO_ASSISTED_ENABLED`
- `APP_DEMO_ASSISTED_TENANT_CODE`
- `APP_DEMO_ASSISTED_USER_EMAIL`
- `APP_DEMO_ASSISTED_USER_PASSWORD`
- `APP_DEMO_ASSISTED_FEATURE_FLAG_KEY`
- `APP_DEMO_ASSISTED_ENFORCE_FEATURE_FLAG`

### Bootstrap/reset do sysadmin master

- `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED`
- `APP_BOOTSTRAP_MASTER_ADMIN_TENANT_CODE`
- `APP_BOOTSTRAP_MASTER_ADMIN_TENANT_NAME`
- `APP_BOOTSTRAP_MASTER_ADMIN_EMAIL`
- `APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD`
- `APP_BOOTSTRAP_MASTER_ADMIN_FULL_NAME`

## Procedimento recomendado para GCP

### Frontend

- O frontend so precisa de `NEXT_PUBLIC_API_URL`.
- Essa variavel e publica por definicao e deve apontar para a API com `/api/v1`.
- Nenhuma senha de demo ou sysadmin deve existir no build do frontend.

### Backend com Secret Manager

Mapeie os secrets do GCP Secret Manager para environment variables do servico backend:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_DEMO_ASSISTED_USER_PASSWORD`
- `APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD`

Variaveis nao sensiveis podem permanecer como env comuns:

- `SPRING_PROFILES_ACTIVE=prod`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_DEMO_ASSISTED_ENABLED`
- `APP_DEMO_ASSISTED_TENANT_CODE`
- `APP_DEMO_ASSISTED_USER_EMAIL`
- `APP_DEMO_ASSISTED_ENFORCE_FEATURE_FLAG`
- `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED`
- `APP_BOOTSTRAP_MASTER_ADMIN_TENANT_CODE`
- `APP_BOOTSTRAP_MASTER_ADMIN_EMAIL`

### Bootstrap do sysadmin no GCP

Fluxo recomendado:

1. Deploy normal com `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED=false`.
2. Para bootstrap inicial ou reset controlado, publicar uma revisao temporaria com:
   - `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED=true`
   - `APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD` vindo do Secret Manager
3. Validar acesso do sysadmin.
4. Voltar `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED=false`.

Isso evita senha fixa em migration e evita deixar reset automatico permanentemente ativo.

### Habilitacao da demo comercial

Fluxo recomendado:

1. Criar tenant demo dedicado.
2. Criar usuario demo dedicado.
3. Configurar `APP_DEMO_ASSISTED_*` com essas credenciais.
4. Ativar a feature flag global `demo.assisted.enabled` apenas quando a demo precisar ficar disponivel.
5. Desativar a feature flag quando a demo nao for necessaria.

## Decisoes de seguranca

- O frontend nao preenche nem revela credenciais de demo.
- A conta `sysadmin@phaiffer.tech` nao e mais tratada como demo.
- A migration do master nao depende de senha hardcoded operacional.
- Endpoints de docs e observabilidade ficam desabilitados publicamente em `prod`.
- O proxy reverso bloqueia `/actuator`, `/swagger-ui` e `/v3/api-docs`.

## Limites atuais

- O diretorio `infra/terraform` permanece apenas como referencia historica e nao representa a arquitetura alvo.
- A base atual de IaC para GCP passou para `infra/gcp/terraform`.
- O runbook de deploy inicial na GCP esta em `docs/platform/gcp-minimal-infra.pt-BR.md`.
