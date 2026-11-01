# Gestão Pet Payments - Visão da Camada de Cobrança

Data de referência: 2026-05-12.

> **Estado em 2026-10-31.** Parte desta proposta já foi implementada (migração `V71__finance_payment_events_foundation.sql`):
>
> - tabela `finance_payment_events`, com tipos de evento (`INVOICE_CREATED`, `INVOICE_ISSUED`, `PAYMENT_RECORDED`, `PAYMENT_CONFIRMED`, `PAYMENT_CANCELED`, `WEBHOOK_RECEIVED` etc.), status (`RECORDED`, `PROCESSED`, `IGNORED`, `FAILED`) e chave de idempotência única por tenant e provedor;
> - `FinanceInvoiceService` e `FinancePaymentService` registram esses eventos ao criar, emitir e cancelar faturas e ao registrar, confirmar e cancelar pagamentos; a linha do tempo fica em `GET /api/v1/finance/invoices/{id}/events`;
> - porta `PaymentProvider` com `ManualPaymentProvider` e `NoopPaymentProvider`, resolvidos por `PaymentProviderRegistry`. Provedores externos (Asaas, Mercado Pago, Stripe, Pagar.me) existem apenas como valores de enum, sem implementação.
>
> Continuam como proposta: `payment_method`, `payment_attempt`, `payment_provider_config`, PIX e cartão reais e webhooks de provedor.

Este documento planeja a camada de pagamentos/cobrança do Gestão Pet para a próxima fase do produto. Ele reflete o estado real do monorepo PhaifferTech: hoje existe cobrança manual assistida, faturas e pagamentos em `core.finance`, especialização Gestão Pet em `modules.pet.invoice` e renovação com dados PIX textuais em fluxo manual. Não há gateway PIX/cartão integrado, não há PIX dinâmico e a validação oficial via WhatsApp ainda depende do desbloqueio de billing externo da Meta.

## Objetivo

A camada deve tratar pagamento como uma capacidade genérica de cobrança, não como um módulo PIX. O Gestão Pet precisa conseguir emitir ou reutilizar uma cobrança, registrar uma ou mais tentativas de pagamento, confirmar manualmente recebimentos e, no futuro, conectar provedores externos sem mudar o fluxo operacional de Banho e Tosa.

Escopo desta trilha:

- preservar o fluxo manual atual;
- preparar domínio para PIX, débito, crédito e manual;
- documentar entidades, status, serviços e ciclo de vida;
- orientar implementação incremental;
- manter o foco em Banho e Tosa, sem abrir escopo para clínica.

Fora do escopo desta trilha:

- integração real com PSP/gateway;
- geração de PIX dinâmico;
- captura, autorização ou tokenização real de cartão;
- conciliação bancária automática;
- refatoração oportunista de módulos existentes.

## Estado Atual do Produto

O produto já possui fundação financeira compartilhada:

- `finance_invoices`: faturas tenant-scoped com módulo de origem, contraparte, contexto de negócio, valor, status e dados fiscais básicos.
- `finance_payments`: registros de pagamento ligados a fatura, com método, status, valor, referência e observações.
- `finance_cash_movements`: movimentações de caixa relacionadas a pagamentos confirmados.
- `pet_invoices`: especialização Gestão Pet que liga a cobrança ao cliente/pet e usa `finance_invoice_id`.
- `pet_billing_message_settings`: configuração textual de cobrança para mensagens preparadas, incluindo chave PIX textual e nome de exibição.

O fluxo validado hoje é manual assistido:

1. O operador cria ou reutiliza uma fatura Gestão Pet.
2. A renovação de plano pode preparar mensagem com valor, contexto e dados PIX textuais.
3. O frontend exibe/copia a mensagem para revisão e envio manual.
4. Quando o cliente paga por fora do sistema, o operador registra o pagamento.
5. O pagamento confirmado atualiza o saldo da fatura e pode gerar movimento de caixa.

Essa base deve continuar funcionando mesmo depois da chegada de provedores externos.

## Arquitetura Proposta

A camada proposta fica como extensão do `core.finance`, com adaptadores específicos em módulos verticais apenas quando houver contexto de negócio. A regra principal e:

- `core.finance`: dono de invoice, método, tentativa, provider config, evento e contratos de provider.
- `modules.pet.invoice`: dono da leitura/ação Gestão Pet, ligando cobrança a cliente, pet, plano, atendimento e mensagens.
- `modules.pet.billing`: dono dos templates e textos operacionais para envio manual assistido.
- `core.messaging`: continua separado, usado para envio/notificação quando disponível, sem virar dependência para pagamento.

Fluxo de dependência esperado:

```text
modules.pet.invoice
    -> core.finance

modules.pet.billing
    -> modules.pet.plan / modules.pet.appointment / modules.pet.invoice
    -> core.finance

core.finance
    -> shared tenant/security/audit
    -> provider interfaces internas
```

Nenhum provider real é chamado nesta fase. Os providers concretos atuais são `ManualPaymentProvider` e `NoopPaymentProvider`, responsáveis apenas por registrar eventos internos e manter comportamento previsível para demo/TCC.

## Conceitos Principais

### Billing Invoice

Representa a cobrança a receber. No código atual, `finance_invoices` já cumpre boa parte desse papel. A proposta usa o nome conceitual `billing_invoice` para deixar claro o modelo de destino, mas a implementação pode evoluir a partir de `finance_invoices` para evitar migração desnecessária.

Uma invoice deve ser independente do meio de pagamento. Ela diz quem deve, quanto deve, por qual contexto e em qual status esta.

### Payment Method

Representa uma forma de pagamento disponível ou escolhida para uma cobrança. Pode ser manual, PIX, cartão de débito ou cartão de crédito. Para cartão real futuro, o sistema não deve armazenar dados sensíveis; deve guardar apenas token/alias do provider, últimos digitos quando aplicável, bandeira e metadados seguros.

### Payment Attempt

Representa uma tentativa concreta de cobrar uma invoice por um método e canal/provedor. Uma invoice pode ter várias tentativas: por exemplo, uma tentativa PIX expirada, seguida de pagamento manual confirmado.

### Payment Provider Config

Guarda configuração tenant-scoped do provedor ou canal. Na fase manual, pode guardar apenas dados exibíveis como chave PIX textual e nome de cobrança. No futuro, credenciais reais devem ir para Secret Manager/ambiente seguro, mantendo no banco apenas referências e status de configuração.

### Payment Event

Registra fatos de ciclo de vida: invoice emitida, tentativa criada, pagamento confirmado manualmente, tentativa expirada, evento recebido de webhook, erro de provider. Serve para auditoria, suporte e conciliação futura.

## Ciclo de Vida da Cobrança

Estados sugeridos para invoice:

```text
DRAFT -> ISSUED -> PARTIALLY_PAID -> PAID
                 -> OVERDUE
                 -> CANCELED
                 -> VOID
```

Compatibilidade com o estado atual:

- `DRAFT`: fatura em rascunho.
- `ISSUED`: fatura emitida e pendente.
- `PAID`: fatura quitada.
- `CANCELED`: fatura cancelada.

`PARTIALLY_PAID`, `OVERDUE` e `VOID` são extensões futuras. Elas não precisam ser adicionadas antes de haver tela/regra que realmente use esses estados.

Estados sugeridos para tentativa:

```text
CREATED -> PENDING -> REQUIRES_ACTION -> AUTHORIZED -> CONFIRMED
        -> FAILED
        -> EXPIRED
        -> CANCELED
        -> REFUNDED
```

Compatibilidade com `FinancePaymentStatus` atual:

- `PENDING`: pagamento registrado mas ainda não confirmado.
- `CONFIRMED`: pagamento recebido/confirmado.
- `CANCELED`: pagamento cancelado.

O ponto importante e não confundir pagamento confirmado (`finance_payments`) com tentativa de pagamento (`payment_attempt`). A tentativa pode falhar ou expirar sem gerar pagamento confirmado.

## Encaixe no Monorepo Atual

Implementação incremental recomendada:

1. Manter `finance_invoices` e `finance_payments` como base operacional atual.
2. Criar novas tabelas de tentativa/evento/configuração quando houver necessidade real.
3. Evitar renomear `finance_invoices` para `billing_invoice` nesta fase; usar o nome conceitual nos docs e preservar a compatibilidade física.
4. Adicionar services/interfaces em `core.finance.payment` ou pacote equivalente, sem alterar controllers Gestão Pet antes de haver caso de uso.
5. Expor no Gestão Pet apenas leituras e ações coerentes com a operação de Banho e Tosa: emitir cobrança, preparar mensagem, registrar pagamento manual, visualizar tentativas e eventos.

## Compatibilidade Manual

O fluxo manual atual continua sendo o primeiro canal suportado. Ele deve ser modelado como:

- `PaymentMethodType.MANUAL` para recebimento por fora do sistema;
- `PaymentChannel.MANUAL_OPERATOR` para ação feita pelo usuário;
- `PaymentProvider.MANUAL` ou `NOOP`;
- `PaymentAttemptStatus.CONFIRMED` apenas quando o operador confirma recebimento;
- `payment_event` registrando quem confirmou, quando, valor, observação e referência.

PIX textual atual deve continuar como dado exibível de configuração/mensagem, não como tentativa de PIX dinâmico. Quando PIX real chegar, ele entra como novo provider/canal sem substituir o fluxo manual.

