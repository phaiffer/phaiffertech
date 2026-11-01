# TCC - Notas de Arquitetura de Pagamentos

Data de referência: 2026-05-12.

> **Estado em 2026-10-31.** Parte desta proposta já foi implementada (migração `V71__finance_payment_events_foundation.sql`):
>
> - tabela `finance_payment_events`, com tipos de evento (`INVOICE_CREATED`, `INVOICE_ISSUED`, `PAYMENT_RECORDED`, `PAYMENT_CONFIRMED`, `PAYMENT_CANCELED`, `WEBHOOK_RECEIVED` etc.), status (`RECORDED`, `PROCESSED`, `IGNORED`, `FAILED`) e chave de idempotência única por tenant e provedor;
> - `FinanceInvoiceService` e `FinancePaymentService` registram esses eventos ao criar, emitir e cancelar faturas e ao registrar, confirmar e cancelar pagamentos; a linha do tempo fica em `GET /api/v1/finance/invoices/{id}/events`;
> - porta `PaymentProvider` com `ManualPaymentProvider` e `NoopPaymentProvider`, resolvidos por `PaymentProviderRegistry`. Provedores externos (Asaas, Mercado Pago, Stripe, Pagar.me) existem apenas como valores de enum, sem implementação.
>
> Continuam como proposta: `payment_method`, `payment_attempt`, `payment_provider_config`, PIX e cartão reais e webhooks de provedor.

Estas notas conectam a proposta de pagamentos/cobrança ao roadmap acadêmico do Gestão Pet Banho e Tosa. O objetivo e explicar uma fundação futura sem afirmar que gateway, PIX dinâmico ou cartão real já estão prontos.

## Posicionamento no TCC

O Gestão Pet demonstra uma operação de Banho e Tosa com agenda, planos, estoque, comissão, cobrança e mensagens preparadas. A camada de pagamentos deve ser apresentada como evolução da cobrança operacional, não como entrega de integração financeira externa.

Estado real:

- faturas e pagamentos existem na base financeira compartilhada;
- faturas Gestão Pet usam especialização em `pet_invoices`;
- renovação de plano pode preparar mensagem com dados de cobrança;
- PIX aparece como informação textual para pagamento manual;
- WhatsApp oficial ainda não está validado ponta a ponta por bloqueio de billing externo da Meta;
- cartão e pagamento online ainda não estão integrados.

## Decisão Arquitetural

A decisão recomendada e tratar pagamento como camada genérica de cobrança:

- invoice representa o valor a receber;
- método representa a forma possível de pagamento;
- tentativa representa uma execução por método/provedor;
- evento registra fatos e integra suporte/conciliação;
- provider externo fica atras de interface.

Essa abordagem evita um "módulo PIX" prematuro. PIX, débito, crédito e manual passam a ser variações do mesmo ciclo de cobrança.

## Relação com Banho e Tosa

Os principais contextos de cobrança do Gestão Pet são:

- atendimento avulso;
- extras de atendimento;
- renovação de plano;
- fechamento mensal ou operacional;
- pagamento manual confirmado pela recepção.

Esses contextos devem continuar em `modules.pet`, enquanto os conceitos financeiros reutilizáveis ficam em `core.finance`.

## Narrativa Recomendada

Para apresentação:

1. Mostrar que o produto resolve a operação do dia: agenda, plano, estoque e cobrança.
2. Explicar que a cobrança atual é manual assistida, adequada para demo e validação.
3. Mostrar que o backend já separa Gestão Pet de financeiro compartilhado.
4. Apresentar a evolução para tentativas/eventos/providers como arquitetura futura.
5. Deixar claro que PIX dinâmico, cartão e webhooks são fases futuras.

## Riscos Controlados

- Evita depender de PSP durante a entrega acadêmica.
- Evita prometer WhatsApp oficial enquanto há bloqueio externo.
- Evita armazenar dados sensíveis de cartão.
- Evita refatorar `pet.invoice` antes de haver ganho demonstrável.
- Mantem o foco em Banho e Tosa, sem expandir para clínica.

## Referências Internas

- [Visão da camada de cobrança](../payments/payment-layer-overview.md)
- [Modelo de domínio de pagamentos](../payments/payment-domain-model.md)
- [Roadmap incremental de pagamentos](../payments/payment-roadmap.md)
- [Roadmap técnico do TCC](roadmap.md)
- [Decision log](decision-log.md)

