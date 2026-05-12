# PetFlow Payments - Modelo de Dominio Proposto

Data de referencia: 2026-05-12.

Este documento descreve o modelo de dominio sugerido para a camada de pagamentos/cobranca. Ele e uma proposta arquitetural para evolucao incremental, nao uma afirmacao de que todas as tabelas ja existem.

## Principios de Modelagem

- Invoice e independente do meio de pagamento.
- Metodo de pagamento descreve capacidade ou escolha; tentativa descreve execucao.
- Confirmacao financeira deve ser rastreavel por evento.
- Provider externo e detalhe de infraestrutura, nao regra de negocio do PetFlow.
- Manual deve ser um canal de primeira classe, nao excecao.
- Dados sensiveis de cartao nunca devem ser persistidos no banco da aplicacao.
- Todo registro deve ser tenant-scoped e compatibilizado com auditoria/soft delete existentes.

## Entidades e Tabelas

### `billing_invoice`

Nome conceitual para a cobranca. Implementacao inicial pode continuar usando `finance_invoices`.

Campos sugeridos:

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | UUID | Identificador da cobranca. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `source_module` | enum | `PET`, `CRM`, `MANUAL`, legado quando necessario. |
| `counterparty_reference_type` | varchar | Ex.: `PET.CLIENT`. |
| `counterparty_reference_id` | UUID | Cliente/responsavel no PetFlow. |
| `counterparty_name` | varchar | Snapshot do nome para leitura financeira. |
| `business_context_type` | varchar | Ex.: `PET.APPOINTMENT`, `PET.PLAN_RENEWAL`, `PET.MONTHLY_CLOSE`. |
| `business_context_id` | UUID | Id do atendimento/plano/fechamento quando aplicavel. |
| `business_context_label` | varchar | Label operacional para dashboard e suporte. |
| `description` | varchar | Descricao curta da cobranca. |
| `status` | enum | Status da invoice. |
| `currency` | varchar | Padrao `BRL`. |
| `total_amount` | decimal | Valor total. |
| `paid_amount` | decimal | Valor confirmado. |
| `issued_at` | timestamp | Emissao. |
| `due_at` | timestamp | Vencimento. |
| `paid_at` | timestamp | Quitacao. |
| `canceled_at` | timestamp | Cancelamento. |
| `metadata` | jsonb | Futuro: detalhes nao estruturais, com uso controlado. |

Relacao atual:

- `finance_invoices` ja possui a maioria desses campos.
- `pet_invoices.finance_invoice_id` especializa a cobranca para Banho e Tosa.

### `payment_method`

Representa metodo configurado, salvo ou selecionavel.

Campos sugeridos:

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `type` | enum | `MANUAL`, `PIX`, `DEBIT_CARD`, `CREDIT_CARD`. |
| `status` | enum | `ACTIVE`, `INACTIVE`, `UNVERIFIED`, `SUSPENDED`. |
| `display_name` | varchar | Nome exibivel ao operador. |
| `provider` | enum | `MANUAL`, `NOOP`, `PIX_TEXT`, PSP futuro. |
| `provider_payment_method_id` | varchar | Alias/token do provider, nunca PAN/cartao bruto. |
| `pix_key` | varchar | Apenas se textual/manual; PIX dinamico futuro deve usar attempt. |
| `card_brand` | varchar | Futuro, se tokenizado pelo provider. |
| `card_last4` | varchar | Futuro, somente ultimos digitos. |
| `metadata` | jsonb | Metadados seguros e nao sensiveis. |

Na fase 1, esta tabela pode ser adiada se `pet_billing_message_settings` continuar suficiente para dados textuais. Ela passa a fazer sentido quando houver mais de um meio configuravel por tenant.

### `payment_attempt`

Representa a execucao de uma cobranca por um meio/canal.

Campos sugeridos:

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `invoice_id` | UUID | FK para invoice. |
| `payment_method_id` | UUID | Metodo usado, quando existir. |
| `method_type` | enum | Snapshot do tipo: `PIX`, `DEBIT_CARD`, `CREDIT_CARD`, `MANUAL`. |
| `provider` | enum | Provider/canal responsavel. |
| `channel` | enum | Origem operacional da tentativa. |
| `status` | enum | Status da tentativa. |
| `amount` | decimal | Valor tentado. |
| `currency` | varchar | Padrao `BRL`. |
| `provider_attempt_id` | varchar | Id externo futuro. |
| `provider_reference` | varchar | NSU, end-to-end id, charge id ou referencia manual. |
| `expires_at` | timestamp | Util para PIX real futuro. |
| `confirmed_at` | timestamp | Confirmacao da tentativa. |
| `failure_code` | varchar | Codigo de falha normalizado. |
| `failure_message` | varchar | Mensagem curta para suporte. |
| `metadata` | jsonb | Payload resumido e seguro. |

Regra importante: `payment_attempt` nao substitui `finance_payments`. Quando uma tentativa e confirmada, ela pode gerar ou vincular um `finance_payment` confirmado. Assim o ledger financeiro continua simples.

### `payment_provider_config`

Configura tenant/provedor/canal.

Campos sugeridos:

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `provider` | enum | `MANUAL`, `NOOP`, `PIX_TEXT`, PSP futuro. |
| `status` | enum | `DISABLED`, `ACTIVE`, `PENDING_VALIDATION`, `ERROR`. |
| `display_name` | varchar | Nome operacional. |
| `environment` | enum | `SANDBOX`, `PRODUCTION`, `MANUAL`. |
| `credential_reference` | varchar | Referencia segura, nao segredo em texto claro. |
| `webhook_secret_reference` | varchar | Referencia segura futura. |
| `capabilities` | jsonb | Ex.: `["PIX", "CREDIT_CARD"]`. |
| `settings` | jsonb | Configuracoes nao sensiveis. |

Na fase atual, `pet_billing_message_settings` pode continuar como fonte de chave PIX textual. `payment_provider_config` deve nascer quando houver provider real ou necessidade de multiplos canais configuraveis.

### `payment_event`

Trilha de auditoria e integracao.

Campos sugeridos:

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | UUID | Identificador. |
| `tenant_id` | UUID | Isolamento multi-tenant. |
| `invoice_id` | UUID | Cobranca relacionada. |
| `payment_attempt_id` | UUID | Tentativa relacionada, se existir. |
| `finance_payment_id` | UUID | Pagamento confirmado relacionado, se existir. |
| `provider` | enum | Origem do evento. |
| `event_type` | enum | Fato ocorrido. |
| `event_status` | enum | `RECEIVED`, `PROCESSED`, `IGNORED`, `FAILED`. |
| `idempotency_key` | varchar | Evita processamento duplicado. |
| `occurred_at` | timestamp | Momento do evento. |
| `payload_reference` | varchar | Referencia segura para payload bruto, se necessario. |
| `summary` | varchar | Resumo legivel. |
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

O enum atual `FinancePaymentMethod` ja inclui `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `MANUAL`, alem de outros metodos financeiros. A camada de tentativa pode usar um enum mais restrito para a primeira expansao PetFlow.

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

`AUTHORIZED` e mais relevante para cartao. `EXPIRED` e mais relevante para PIX dinamico futuro. Manual pode ir direto de `CREATED` para `CONFIRMED` quando o operador confirma recebimento.

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

Os nomes de PSP sao placeholders arquiteturais, nao escolha de integracao. A decisao real deve ocorrer em fase propria.

### `PaymentChannel`

```text
MANUAL_OPERATOR
CUSTOMER_PORTAL
WHATSAPP_MESSAGE
BACKOFFICE
WEBHOOK
SYSTEM_JOB
```

Na fase atual, somente `MANUAL_OPERATOR` e `BACKOFFICE` sao necessarios. `WHATSAPP_MESSAGE` nao implica envio oficial validado enquanto o billing externo da Meta estiver bloqueando o ponta a ponta.

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

## Servicos e Interfaces Sugeridos

### `BillingInvoiceService`

Responsavel por criar, emitir, cancelar, recalcular saldo e consultar cobrancas. Pode inicialmente reaproveitar `FinanceInvoiceService`.

Operacoes:

- `createDraft(command)`
- `issue(invoiceId)`
- `cancel(invoiceId, reason)`
- `recordManualPayment(command)`
- `recalculatePaidAmount(invoiceId)`
- `findByBusinessContext(contextType, contextId)`

### `PaymentAttemptService`

Responsavel por criar e acompanhar tentativas.

Operacoes:

- `createAttempt(command)`
- `markPending(attemptId)`
- `confirmAttempt(attemptId, confirmation)`
- `failAttempt(attemptId, failure)`
- `expireAttempt(attemptId)`
- `listByInvoice(invoiceId)`

### `PaymentProvider`

Contrato interno para provedores.

Operacoes sugeridas:

- `supports(methodType)`
- `createPaymentAttempt(context)`
- `cancelPaymentAttempt(providerAttemptId)`
- `parseWebhook(payload, headers)`

Implementacoes iniciais:

- `ManualPaymentProvider`: sem chamada externa; registra tentativa/evento para recebimento manual.
- `NoopPaymentProvider`: usado em testes/demo para validar ciclo sem provider.

### `PaymentEventService`

Responsavel por append-only log, idempotencia e resumo auditavel.

Operacoes:

- `append(event)`
- `appendIfNotExists(idempotencyKey, event)`
- `listByInvoice(invoiceId)`
- `markProcessed(eventId)`
- `markFailed(eventId, reason)`

### `PetBillingFacade`

Facade em `modules.pet` para casos de uso de Banho e Tosa.

Operacoes:

- emitir cobranca de atendimento;
- preparar cobranca de renovacao de plano;
- registrar pagamento manual;
- montar resumo para dashboard/fechamento;
- manter mensagens preparadas com dados de cobranca textual.

Essa facade deve depender de contratos de `core.finance`, nao de provider especifico.

## Regras de Integridade

- Uma invoice cancelada nao deve aceitar nova tentativa confirmavel.
- Pagamento confirmado nao deve ser editado para outro valor/metodo sem cancelamento/reversao controlada.
- A soma de pagamentos confirmados nao deve ultrapassar `total_amount`, exceto se houver regra explicita de credito/saldo futuro.
- Tentativas expiradas/falhadas nao geram pagamento confirmado.
- Webhook futuro deve ser idempotente.
- Eventos devem ser append-only sempre que possivel.
- Dados de cartao sensiveis nunca entram em logs, eventos ou metadata.

