# Demo, Sysadmin e Secrets

## Objetivo

Este documento separa explicitamente tres conceitos operacionais que estavam misturados:

- `master tenant` da PhaifferTech
- `sysadmin` operacional da empresa
- `demo comercial assistida`

Também define como configurar o projeto com environment variables e secrets no GCP sem expor credenciais no frontend.

## Estado alvo

### Master tenant e sysadmin

- O tenant `PHAIFFER_TECH` e o usuário `sysadmin@phaiffer.tech` representam a operação real da PhaifferTech.
- Eles não devem ser usados como demo comercial.
- A migration `V37__setup_master_tenant_phaiffer.sql` cria apenas o bootstrap estrutural:
  - tenant master marcado como `platform_owner`
  - usuário placeholder de sysadmin
  - senha não operacional e não reutilizável
  - vínculo com `PLATFORM_ADMIN`
- A senha operacional passa a ser aplicada fora da migration, por bootstrap/reset controlado por env.

### Demo comercial assistida

- A demo comercial deve usar tenant e usuário próprios.
- O frontend não conhece e não preenche credenciais.
- O botão `Usar demo` chama `POST /api/v1/auth/demo-login`.
- O backend executa o login usando secrets do ambiente.
- Em produção, a demo só deve funcionar quando:
  - `APP_DEMO_ASSISTED_ENABLED=true`
  - as credenciais do demo estiverem configuradas
  - a feature flag global `demo.assisted.enabled` estiver ativa

### Dev versus produção

- `admin@local.test` / `Admin@123` continuam sendo apenas seed de desenvolvimento.
- Esse acesso não deve ser tratado como demo comercial.
- O frontend de produção não embute mais o fluxo de demo via preenchimento de formulário.

## Variáveis relevantes

### Backend obrigatórias em produção

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

- O frontend só precisa de `NEXT_PUBLIC_API_URL`.
- Essa variável é pública por definição e deve apontar para a API com `/api/v1`.
- Nenhuma senha de demo ou sysadmin deve existir no build do frontend.

### Backend com Secret Manager

Mapeie os secrets do GCP Secret Manager para environment variables do serviço backend:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_DEMO_ASSISTED_USER_PASSWORD`
- `APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD`

Variáveis não sensíveis podem permanecer como env comuns:

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
2. Para bootstrap inicial ou reset controlado, publicar uma revisão temporária com:
   - `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED=true`
   - `APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD` vindo do Secret Manager
3. Validar acesso do sysadmin.
4. Voltar `APP_BOOTSTRAP_MASTER_ADMIN_ENABLED=false`.

Isso evita senha fixa em migration e evita deixar reset automático permanentemente ativo.

### Habilitação da demo comercial

Fluxo recomendado:

1. Criar tenant demo dedicado.
2. Criar usuário demo dedicado.
3. Configurar `APP_DEMO_ASSISTED_*` com essas credenciais.
4. Ativar a feature flag global `demo.assisted.enabled` apenas quando a demo precisar ficar disponível.
5. Desativar a feature flag quando a demo não for necessária.

## Decisões de segurança

- O frontend não preenche nem revela credenciais de demo.
- A conta `sysadmin@phaiffer.tech` não é mais tratada como demo.
- A migration do master não depende de senha hardcoded operacional.
- Endpoints de docs e observabilidade ficam desabilitados publicamente em `prod`.
- O proxy reverso bloqueia `/actuator`, `/swagger-ui` e `/v3/api-docs`.

## Limites atuais

- O diretório `infra/terraform` permanece apenas como referência histórica e não representa a arquitetura alvo.
- A base atual de IaC para GCP passou para `infra/gcp/terraform`.
- O runbook de deploy inicial na GCP está em `docs/platform/gcp-minimal-infra.pt-BR.md`.
