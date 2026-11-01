# Gestão Pet Payments - Modelo de Domínio Proposto

Data de referência: 2026-05-12.

> **Estado em 2026-10-31.** Parte desta proposta já foi implementada (migração `V71__finance_payment_events_foundation.sql`):
>
> - tabela `finance_payment_events`, com tipos de evento (`INVOICE_CREATED`, `INVOICE_ISSUED`, `PAYMENT_RECORDED`, `PAYMENT_CONFIRMED`, `PAYMENT_CANCELED`, `WEBHOOK_RECEIVED` etc.), status (`RECORDED`, `PROCESSED`, `IGNORED`, `FAILED`) e chave de idempotência única por tenant e provedor;
> - `FinanceInvoiceService` e `FinancePaymentService` registram esses eventos ao criar, emitir e cancelar faturas e ao registrar, confirmar e cancelar pagamentos; a linha do tempo fica em `GET /api/v1/finance/invoices/{id}/events`;
> - porta `PaymentProvider` com `ManualPaymentProvider` e `NoopPaymentProvider`, resolvidos por `PaymentProviderRegistry`. Provedores externos (Asaas, Mercado Pago, Stripe, Pagar.me) existem apenas como valores de enum, sem implementação.
>
> Continuam como proposta: `payment_method`, `payment_attempt`, `payment_provider_config`, PIX e cartão reais e webhooks de provedor.

Este documento descreve o modelo de domínio sugerido para a camada de pagamentos/cobrança. Ele é uma proposta arquitetural para evolução incremental, não uma afirmação de que todas as tabelas já existem.

## Principios de Modelagem

- Invoice é independente do meio de pagamento.
- Método de pagamento descreve capacidade ou escolha; tentativa descreve execução.
- Confirmação financeira deve ser rastreável por evento.
- Provider externo e detalhe de infraestrutura, não regra de negócio do Gestão Pet.
- Manual deve ser um canal de primeira classe, não exceção.
- Dados sensíveis de cartão nunca devem ser persistidos no banco da aplicação.
- Todo registro deve ser tenant-scoped e compatibilizado com auditoria/soft delete existentes.

## Entidades e Tabelas

### `billing_invoice`

Nome conceitual para a cobrança. Implementação inicial pode continuar usando `finance_invoices`.

Campos sugeridos:

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID | Identificador da cobrança. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `source_module` | enum | `PET`, `CRM`, `MANUAL`, legado quando necessário. |
| `counterparty_reference_type` | varchar | Ex.: `PET.CLIENT`. |
| `counterparty_reference_id` | UUID | Cliente/responsável no Gestão Pet. |
| `counterparty_name` | varchar | Snapshot do nome para leitura financeira. |
| `business_context_type` | varchar | Ex.: `PET.APPOINTMENT`, `PET.PLAN_RENEWAL`, `PET.MONTHLY_CLOSE`. |
| `business_context_id` | UUID | Id do atendimento/plano/fechamento quando aplicável. |
| `business_context_label` | varchar | Label operacional para dashboard e suporte. |
| `description` | varchar | Descrição curta da cobrança. |
| `status` | enum | Status da invoice. |
| `currency` | varchar | Padrão `BRL`. |
| `total_amount` | decimal | Valor total. |
| `paid_amount` | decimal | Valor confirmado. |
| `issued_at` | timestamp | Emissão. |
| `due_at` | timestamp | Vencimento. |
| `paid_at` | timestamp | Quitação. |
| `canceled_at` | timestamp | Cancelamento. |
| `metadata` | jsonb | Futuro: detalhes não estruturais, com uso controlado. |

Relação atual:

- `finance_invoices` já possui a maioria desses campos.
- `pet_invoices.finance_invoice_id` especializa a cobrança para Banho e Tosa.

### `payment_method`

Representa método configurado, salvo ou selecionável.

Campos sugeridos:

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `type` | enum | `MANUAL`, `PIX`, `DEBIT_CARD`, `CREDIT_CARD`. |
| `status` | enum | `ACTIVE`, `INACTIVE`, `UNVERIFIED`, `SUSPENDED`. |
| `display_name` | varchar | Nome exibível ao operador. |
| `provider` | enum | `MANUAL`, `NOOP`, `PIX_TEXT`, PSP futuro. |
| `provider_payment_method_id` | varchar | Alias/token do provider, nunca PAN/cartão bruto. |
| `pix_key` | varchar | Apenas se textual/manual; PIX dinâmico futuro deve usar attempt. |
| `card_brand` | varchar | Futuro, se tokenizado pelo provider. |
| `card_last4` | varchar | Futuro, somente últimos digitos. |
| `metadata` | jsonb | Metadados seguros e não sensíveis. |

Na fase 1, esta tabela pode ser adiada se `pet_billing_message_settings` continuar suficiente para dados textuais. Ela passa a fazer sentido quando houver mais de um meio configurável por tenant.

### `payment_attempt`

Representa a execução de uma cobrança por um meio/canal.

Campos sugeridos:

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `invoice_id` | UUID | FK para invoice. |
| `payment_method_id` | UUID | Método usado, quando existir. |
| `method_type` | enum | Snapshot do tipo: `PIX`, `DEBIT_CARD`, `CREDIT_CARD`, `MANUAL`. |
| `provider` | enum | Provider/canal responsável. |
| `channel` | enum | Origem operacional da tentativa. |
| `status` | enum | Status da tentativa. |
| `amount` | decimal | Valor tentado. |
| `currency` | varchar | Padrão `BRL`. |
| `provider_attempt_id` | varchar | Id externo futuro. |
| `provider_reference` | varchar | NSU, end-to-end id, charge id ou referência manual. |
| `expires_at` | timestamp | Útil para PIX real futuro. |
| `confirmed_at` | timestamp | Confirmação da tentativa. |
| `failure_code` | varchar | Código de falha normalizado. |
| `failure_message` | varchar | Mensagem curta para suporte. |
| `metadata` | jsonb | Payload resumido e seguro. |

Regra importante: `payment_attempt` não substitui `finance_payments`. Quando uma tentativa e confirmada, ela pode gerar ou vincular um `finance_payment` confirmado. Assim o ledger financeiro continua simples.

### `payment_provider_config`

Configura tenant/provedor/canal.

Campos sugeridos:

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `provider` | enum | `MANUAL`, `NOOP`, `PIX_TEXT`, PSP futuro. |
| `status` | enum | `DISABLED`, `ACTIVE`, `PENDING_VALIDATION`, `ERROR`. |
| `display_name` | varchar | Nome operacional. |
| `environment` | enum | `SANDBOX`, `PRODUCTION`, `MANUAL`. |
| `credential_reference` | varchar | Referência segura, não segredo em texto claro. |
| `webhook_secret_reference` | varchar | Referência segura futura. |
| `capabilities` | jsonb | Ex.: `["PIX", "CREDIT_CARD"]`. |
| `settings` | jsonb | Configurações não sensíveis. |

Na fase atual, `pet_billing_message_settings` pode continuar como fonte de chave PIX textual. `payment_provider_config` deve nascer quando houver provider real ou necessidade de múltiplos canais configuráveis.

### `payment_event`

Trilha de auditoria e integração.

Campos sugeridos:

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `invoice_id` | UUID | Cobrança relacionada. |
| `payment_attempt_id` | UUID | Tentativa relacionada, se existir. |
| `finance_payment_id` | UUID | Pagamento confirmado relacionado, se existir. |
| `provider` | enum | Origem do evento. |
| `event_type` | enum | Fato ocorrido. |
| `event_status` | enum | `RECEIVED`, `PROCESSED`, `IGNORED`, `FAILED`. |
| `idempotency_key` | varchar | Evita processamento duplicado. |
| `occurred_at` | timestamp | Momento do evento. |
| `payload_reference` | varchar | Referência segura para payload bruto, se necessário. |
| `summary` | varchar | Resumo legível. |
| `metadata` | jsonb | Dados normalizados e seguros. |

## Enums Sugeridos

### `BillingInvoiceStatus`

```text
DRAFT
ISSUED
PARTIALLY_PAID
PAID
OVERDUE
CANCELED
VOID
```

Estados atuais equivalentes: `FinanceInvoiceStatus` possui `DRAFT`, `ISSUED`, `PAID`, `CANCELED`.

### `PaymentMethodType`

```text
MANUAL
PIX
DEBIT_CARD
CREDIT_CARD
```

O enum atual `FinancePaymentMethod` já inclui `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `MANUAL`, além de outros metodos financeiros. A camada de tentativa pode usar um enum mais restrito para a primeira expansão Gestão Pet.

### `PaymentAttemptStatus`

```text
CREATED
PENDING
REQUIRES_ACTION
AUTHORIZED
CONFIRMED
FAILED
EXPIRED
CANCELED
REFUNDED
```

`AUTHORIZED` e mais relevante para cartão. `EXPIRED` e mais relevante para PIX dinâmico futuro. Manual pode ir direto de `CREATED` para `CONFIRMED` quando o operador confirma recebimento.

### `PaymentProvider`

```text
MANUAL
NOOP
PIX_TEXT
ASAAS
MERCADO_PAGO
PAGSEGURO
STRIPE
ADYEN
OTHER
```

Os nomes de PSP são placeholders arquiteturais, não escolha de integração. A decisão real deve ocorrer em fase própria.

### `PaymentChannel`

```text
MANUAL_OPERATOR
CUSTOMER_PORTAL
WHATSAPP_MESSAGE
BACKOFFICE
WEBHOOK
SYSTEM_JOB
```

Na fase atual, somente `MANUAL_OPERATOR` e `BACKOFFICE` são necessários. `WHATSAPP_MESSAGE` não implica envio oficial validado enquanto o billing externo da Meta estiver bloqueando o ponta a ponta.

### `PaymentEventType`

```text
INVOICE_CREATED
INVOICE_ISSUED
ATTEMPT_CREATED
ATTEMPT_PENDING
ATTEMPT_CONFIRMED
ATTEMPT_FAILED
ATTEMPT_EXPIRED
PAYMENT_RECORDED
PAYMENT_CANCELED
WEBHOOK_RECEIVED
WEBHOOK_IGNORED
RECONCILIATION_MATCHED
RECONCILIATION_MISMATCHED
```

## Serviços e Interfaces Sugeridos

### `BillingInvoiceService`

Responsável por criar, emitir, cancelar, recalcular saldo e consultar cobranças. Pode inicialmente reaproveitar `FinanceInvoiceService`.

Operações:

- `createDraft(command)`
- `issue(invoiceId)`
- `cancel(invoiceId, reason)`
- `recordManualPayment(command)`
- `recalculatePaidAmount(invoiceId)`
- `findByBusinessContext(contextType, contextId)`

### `PaymentAttemptService`

Responsável por criar e acompanhar tentativas.

Operações:

- `createAttempt(command)`
- `markPending(attemptId)`
- `confirmAttempt(attemptId, confirmation)`
- `failAttempt(attemptId, failure)`
- `expireAttempt(attemptId)`
- `listByInvoice(invoiceId)`

### `PaymentProvider`

Contrato interno para provedores.

Operações sugeridas:

- `supports(methodType)`
- `createPaymentAttempt(context)`
- `cancelPaymentAttempt(providerAttemptId)`
- `parseWebhook(payload, headers)`

Implementações iniciais:

- `ManualPaymentProvider`: sem chamada externa; registra tentativa/evento para recebimento manual.
- `NoopPaymentProvider`: usado em testes/demo para validar ciclo sem provider.

### `PaymentEventService`

Responsável por append-only log, idempotência e resumo auditável.

Operações:

- `append(event)`
- `appendIfNotExists(idempotencyKey, event)`
- `listByInvoice(invoiceId)`
- `markProcessed(eventId)`
- `markFailed(eventId, reason)`

### `PetBillingFacade`

Facade em `modules.pet` para casos de uso de Banho e Tosa.

Operações:

- emitir cobrança de atendimento;
- preparar cobrança de renovação de plano;
- registrar pagamento manual;
- montar resumo para dashboard/fechamento;
- manter mensagens preparadas com dados de cobrança textual.

Essa facade deve depender de contratos de `core.finance`, não de provider específico.

## Regras de Integridade

- Uma invoice cancelada não deve aceitar nova tentativa confirmável.
- Pagamento confirmado não deve ser editado para outro valor/método sem cancelamento/reversão controlada.
- A soma de pagamentos confirmados não deve ultrapassar `total_amount`, exceto se houver regra explícita de crédito/saldo futuro.
- Tentativas expiradas/falhadas não geram pagamento confirmado.
- Webhook futuro deve ser idempotente.
- Eventos devem ser append-only sempre que possível.
- Dados de cartão sensíveis nunca entram em logs, eventos ou metadata.

