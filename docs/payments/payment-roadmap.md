# Gestão Pet Payments - Roadmap Incremental

Data de referência: 2026-05-12.

> **Estado em 2026-10-31.** Parte desta proposta já foi implementada (migração `V71__finance_payment_events_foundation.sql`):
>
> - tabela `finance_payment_events`, com tipos de evento (`INVOICE_CREATED`, `INVOICE_ISSUED`, `PAYMENT_RECORDED`, `PAYMENT_CONFIRMED`, `PAYMENT_CANCELED`, `WEBHOOK_RECEIVED` etc.), status (`RECORDED`, `PROCESSED`, `IGNORED`, `FAILED`) e chave de idempotência única por tenant e provedor;
> - `FinanceInvoiceService` e `FinancePaymentService` registram esses eventos ao criar, emitir e cancelar faturas e ao registrar, confirmar e cancelar pagamentos; a linha do tempo fica em `GET /api/v1/finance/invoices/{id}/events`;
> - porta `PaymentProvider` com `ManualPaymentProvider` e `NoopPaymentProvider`, resolvidos por `PaymentProviderRegistry`. Provedores externos (Asaas, Mercado Pago, Stripe, Pagar.me) existem apenas como valores de enum, sem implementação.
>
> Continuam como proposta: `payment_method`, `payment_attempt`, `payment_provider_config`, PIX e cartão reais e webhooks de provedor.

Este roadmap organiza a evolução da camada de pagamentos/cobrança sem assumir gateway pronto. A prioridade é melhorar a cobrança manual assistida e deixar a arquitetura preparada para PIX, débito e crédito quando houver decisão de PSP.

## Fase 1 - Cobrança Manual Assistida Melhor Estruturada

Objetivo: transformar o fluxo manual atual em uma fundação clara e auditável, sem provider externo.

Escopo:

- manter `finance_invoices`, `finance_payments`, `finance_cash_movements` e `pet_invoices`;
- revisar telas e textos para deixar claro que PIX é informação textual;
- padronizar registro manual de pagamento com método, referência, observação e usuário;
- adicionar eventos internos se houver necessidade de auditoria fina;
- opcionalmente introduzir `payment_attempt` com provider `MANUAL`/`NOOP`;
- manter `pet_billing_message_settings` como configuração tenant-scoped para chave PIX textual e templates.

Não fazer:

- gerar PIX dinâmico;
- chamar PSP;
- alterar ciclo de vida de fatura sem necessidade;
- exigir WhatsApp oficial para validar cobrança.

Resultado esperado:

- demo/TCC honesta e demonstrável;
- cobranças pendentes e pagas rastreáveis;
- renovação de plano continua copiável/editável;
- base pronta para trocar o meio sem reescrever Gestão Pet.

## Fase 2 - PIX Real

Objetivo: adicionar PIX real por provider escolhido em fase própria.

Pre-condições:

- decisão de PSP e análise de contrato/custos;
- ambiente sandbox disponível;
- estrategia de armazenamento seguro de credenciais;
- webhook público protegido;
- idempotência e eventos implementados.

Escopo:

- `payment_provider_config` tenant-scoped;
- `payment_attempt` para cobranças PIX;
- status `PENDING`, `EXPIRED`, `CONFIRMED`, `FAILED`;
- expiração controlada de cobranças;
- webhook para confirmação;
- reconciliação básica entre evento do PSP e invoice.

Não fazer nesta fase sem decisão explícita:

- parcelamento;
- split de pagamento;
- antecipação;
- regras fiscais automáticas.

## Fase 3 - Cartão Débito e Crédito

Objetivo: suportar pagamento por cartão com tokenização externa e sem armazenar dado sensível.

Pre-condições:

- PSP com tokenização e conformidade definidas;
- UI segura para captura/tokenização, preferencialmente hosted fields ou redirect;
- regras de estorno/cancelamento desenhadas;
- tratamento de autorização, captura e falha.

Escopo:

- `PaymentMethodType.DEBIT_CARD`;
- `PaymentMethodType.CREDIT_CARD`;
- tentativa com `AUTHORIZED`, `CONFIRMED`, `FAILED`, `CANCELED`;
- metadados seguros como bandeira e últimos quatro digitos;
- eventos de autorização/captura/estorno quando o provider suportar.

Não fazer:

- persistir número completo, CVV ou dados sensíveis de cartão;
- acoplar Gestão Pet a SDK específico de PSP;
- misturar regra de parcelamento no domínio de atendimento.

## Fase 4 - Conciliação e Webhook

Objetivo: amadurecer operação financeira para suporte, auditoria e divergencias.

Escopo:

- `payment_event` append-only;
- idempotência por evento externo;
- conciliação automática por referência, valor, tenant e invoice;
- marcação de divergencias;
- tela de suporte/operação para eventos ignorados ou inconsistentes;
- jobs de expiração e reconciliação.

Resultado esperado:

- menos confirmação manual;
- suporte consegue explicar o histórico de cada cobrança;
- divergencias ficam visíveis sem quebrar o fluxo de Banho e Tosa.

## Sequência Recomendada de Implementação

1. Documentar e validar o modelo com o estado atual do backend/frontend.
2. Se necessário, adicionar `payment_event` primeiro, porque ele melhora auditoria sem mudar UX.
3. Adicionar `payment_attempt` somente quando existir caso de uso de tentativa pendente/expirada.
4. Criar provider `MANUAL`/`NOOP` antes de qualquer PSP real.
5. Evoluir telas Gestão Pet para mostrar tentativas/eventos sem exigir conhecimento financeiro avancado.
6. Integrar PIX real apenas depois de sandbox, webhook e credenciais estarem prontos.
7. Integrar cartão depois de tokenização e desenho de estorno/captura.

## Criterios de Pronto por Fase

Fase 1 está pronta quando:

- cobrança manual continua funcionando;
- operador consegue registrar pagamento sem ambiguidade;
- documentação mostra limites do produto;
- mensagens de renovação não prometem pagamento online.

Fase 2 está pronta quando:

- PIX real pode ser criado, expirar e confirmar via webhook em sandbox;
- tentativa falha/expirada não quita invoice;
- confirmação gera pagamento financeiro rastreável.

Fase 3 está pronta quando:

- cartão é tokenizado fora do backend;
- autorização/captura/erro geram eventos claros;
- dados sensíveis não aparecem no banco nem nos logs.

Fase 4 está pronta quando:

- webhooks são idempotentes;
- divergencias ficam visíveis;
- suporte consegue reconstruir a linha do tempo de uma cobrança.
