# Levantamento do estado atual

Data de referência: 2026-11-05, sobre a `main` em `851ca04`. Esta é a Etapa 0 do rascunho. Serve para o autor conferir os fatos antes da redação; nada aqui é texto final.

Estados: **implementado** existe e é usado; **parcial** existe, com lacuna indicada; **proposta** não existe no código.

## Arquitetura e plataforma

| Fato | Evidência | Estado |
| --- | --- | --- |
| Backend em Java 21 e Spring Boot, como monólito modular em `core`, `shared` e `modules` | `apps/backend/pom.xml`, `docs/tcc/decision-log.md` (DL-001) | Implementado |
| Regras de dependência entre módulos por convenção; não há teste de arquitetura | Sem ArchUnit no `pom.xml`; DL-001 fala em convenção, testes e revisão | Parcial |
| Multi-tenancy com `tenant_id` em banco compartilhado e `TenantContext` por requisição | `shared/tenancy/TenantContextFilter.java`, `TenantContext.java` | Implementado |
| Isolamento garantido só pela aplicação; o banco não tem Row Level Security | Nenhum `ROW LEVEL SECURITY` ou `CREATE POLICY` em `db/migration` | Parcial |
| JWT e autenticação por filtro; refresh token | `shared/security/JwtAuthenticationFilter.java`, `JwtService.java`; refresh em `authService` do frontend | Implementado |
| RBAC com `@RequirePermission`, incluindo direitos por pacote | `shared/security/RequirePermission.java` | Implementado |
| Auditoria | `core/audit/service/AuditLogService.java` | Implementado |
| Soft delete | `deletedAt` em `shared/domain/base/BaseEntity.java` | Implementado |
| Rate limiting em memória, por instância | `ConcurrentHashMap` em `shared/ratelimit/ApiRateLimitFilter.java:36` | Parcial: com várias instâncias, o limite vale para cada uma |
| Feature flags por ambiente | `core/module/featureflag/service/FeatureFlagService.java` | Implementado |
| Logs JSON, Micrometer/Prometheus e exportador OTLP | `logstash-logback-encoder`, `micrometer-registry-prometheus`, `opentelemetry-exporter-otlp` no `pom.xml` | Implementado como dependência; `[VERIFICAR: se há coletor configurado em produção]` |

## Infraestrutura no GCP

| Fato | Evidência | Estado |
| --- | --- | --- |
| Cloud Run para backend e frontend, com escala de 0 a 3 instâncias no backend | `infra/gcp/terraform/cloud_run.tf:27-28`, `variables.tf:120-130` | Implementado como IaC |
| Pool de banco de 5 conexões por instância | `backend_hikari_maximum_pool_size` em `variables.tf:144-147` | Implementado |
| Cloud SQL PostgreSQL 16 sem HA | `availability_type = "ZONAL"` em `cloud_sql.tf:10` | Backup sim; HA proposta |
| Backup automático com retenção de 7 cópias e PITR de 7 dias | `cloud_sql.tf:15-24` | Implementado |
| Proteção contra exclusão e conexão cifrada no Cloud SQL | `cloud_sql.tf:6`, `ssl_mode = "ENCRYPTED_ONLY"`; IP público ativo em `ipv4_enabled = true` | Implementado, com IP público |
| Secret Manager e acesso por conta de serviço própria | `secret_manager.tf:13-18`, `service_accounts.tf:15-19` | Implementado |
| Serviços públicos, sem WAF ou balanceador no Terraform | `allUsers` em `cloud_run.tf:367,376`; `INGRESS_TRAFFIC_ALL` em `variables.tf:99,105` | Parcial |
| Deploy com Workload Identity Federation | `.github/workflows/backend-deploy.yml:20-22`, `frontend-deploy.yml:20-22` | Implementado |
| Fila, tópico ou Pub/Sub | Nada no Terraform nem no código | Proposta |

## Cobrança (`core.finance`)

| Fato | Evidência | Estado |
| --- | --- | --- |
| Faturas, pagamentos e movimentos de caixa | `core/finance/domain`, `FinanceInvoiceService`, `FinancePaymentService` | Implementado |
| Eventos de pagamento com idempotência por tenant e provedor | Migração `V71`, `FinancePaymentEvent`, `FinancePaymentEventService`; `GET /api/v1/finance/invoices/{id}/events` | Implementado |
| Porta de provider de pagamento | `core/finance/payment/provider/PaymentProvider.java`, `PaymentProviderRegistry.java` | Implementado |
| Baixa manual pelo provider | `ManualPaymentProvider`; chamada em `FinancePaymentService.java:304` | Implementado |
| Cobrança externa | `requestExternalCharge` nunca é chamado em `core/finance/service`; `NoopPaymentProvider` responde `NOT_IMPLEMENTED` | Proposta |
| Asaas, Mercado Pago, Stripe e Pagar.me | Só valores em `PaymentProviderType.java` | Proposta |
| Método e tentativa de pagamento | Sem `payment_method`, `payment_attempt` nem `payment_provider_config`; ver `docs/payments/payment-roadmap.md` | Proposta |
| PIX dinâmico, webhook de PSP e conciliação | Nenhum código; `PIX` é só valor de `FinancePaymentMethod`; `WEBHOOK_RECEIVED` é só um tipo de evento | Proposta |
| Dado de cartão | Nenhum armazenamento; sem integração de cartão | Não se aplica hoje |

## Mensagens (`core.messaging`) e fluxo no `modules.pet`

| Fato | Evidência | Estado |
| --- | --- | --- |
| Canais, modelos e envios persistidos, com token cifrado | `MessageChannel`, `MessageTemplateMapping`, `MessageDispatch`, `SecretCipherService` | Implementado |
| Provider WhatsApp Cloud API | `WhatsAppProvider.java`, `WhatsAppCloudApiProvider.java` | Implementado no código; sem uso real, pelo bloqueio de billing relatado pelo autor |
| Envio síncrono, dentro da transação do banco | `MessageSenderService.sendWhatsAppText`, linha 101 sob `@Transactional` da linha 46 | Parcial: sem fila nem retry |
| Disparos de "pet pronto" e renovação de plano | `PetWhatsAppDispatchController`, `PetReadyMessageDispatchService` | Implementado |
| Webhook do WhatsApp recebe status e mensagens | `WhatsAppMessagingController.java:74`, `MessageWebhookService` | Implementado |
| Assinatura do webhook não é validada | Sem `X-Hub-Signature` nem HMAC em `MessageWebhookService`; o POST aceita qualquer corpo | Lacuna de segurança |
| Mensagem preparada e copiada à mão | `navigator.clipboard` em `pet-appointments-page.tsx:1459` e `pet-plans-page.tsx:492` | Implementado |
| Lembrete de renovação nasce de uma ação da operação | `ClientPlanService.java:149` chama `preparePlanLastUseReminder` | Parcial: só prepara |
| Chave PIX textual em mensagens | `pet_billing_message_settings` (migração `V65`), citado em `docs/payments/payment-roadmap.md` | Implementado |

## Processamento assíncrono

| Fato | Evidência | Estado |
| --- | --- | --- |
| Outbox, fila ou consumidor | Sem `Outbox`, `PubSub`, listeners ou `ApplicationEventPublisher` em `apps/backend/src/main/java` | Proposta |
| Tarefas agendadas | Nenhum `@Scheduled` | Proposta |
| Retry com backoff e dead-letter | Nenhum código | Proposta |

## Qualidade

| Fato | Evidência | Estado |
| --- | --- | --- |
| CI com build, testes, lint e build do frontend | `.github/workflows/ci.yml` | Implementado |
| Testes de integração com Testcontainers | `support/IntegrationTestContainersConfig.java`, `AbstractIntegrationTest.java`; 33 arquivos citam a base | Implementado |
| Migrações versionadas | `flyway-core`, `db/migration` | Implementado |

## Itens não verificados

- Resolvido em 2026-11-05: não há produção hoje. Segundo o autor, o ambiente ficou no ar por um período e foi desligado pelo custo mensal de R$ 290. Os workflows confirmam deploys no Cloud Run, com o último sucesso em 2026-04-01; a aplicação do Terraform segue sem confirmação direta.
- Resolvido em 2026-11-05: o webhook do WhatsApp **não** é idempotente. `MessageWebhookService` grava um evento a cada recebimento, sem checar repetição, e `message_delivery_events` (`V70`) só tem índice comum em `provider_message_id`.
- O bloqueio de billing da Meta é informação do autor; não há como confirmar pelo código.
