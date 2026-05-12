# PetFlow Payments - Roadmap Incremental

Data de referencia: 2026-05-12.

Este roadmap organiza a evolucao da camada de pagamentos/cobranca sem assumir gateway pronto. A prioridade e melhorar a cobranca manual assistida e deixar a arquitetura preparada para PIX, debito e credito quando houver decisao de PSP.

## Fase 1 - Cobranca Manual Assistida Melhor Estruturada

Objetivo: transformar o fluxo manual atual em uma fundacao clara e auditavel, sem provider externo.

Escopo:

- manter `finance_invoices`, `finance_payments`, `finance_cash_movements` e `pet_invoices`;
- revisar telas e textos para deixar claro que PIX e informacao textual;
- padronizar registro manual de pagamento com metodo, referencia, observacao e usuario;
- adicionar eventos internos se houver necessidade de auditoria fina;
- opcionalmente introduzir `payment_attempt` com provider `MANUAL`/`NOOP`;
- manter `pet_billing_message_settings` como configuracao tenant-scoped para chave PIX textual e templates.

Nao fazer:

- gerar PIX dinamico;
- chamar PSP;
- alterar ciclo de vida de fatura sem necessidade;
- exigir WhatsApp oficial para validar cobranca.

Resultado esperado:

- demo/TCC honesta e demonstravel;
- cobrancas pendentes e pagas rastreaveis;
- renovacao de plano continua copiavel/editavel;
- base pronta para trocar o meio sem reescrever PetFlow.

## Fase 2 - PIX Real

Objetivo: adicionar PIX real por provider escolhido em fase propria.

Pre-condicoes:

- decisao de PSP e analise de contrato/custos;
- ambiente sandbox disponivel;
- estrategia de armazenamento seguro de credenciais;
- webhook publico protegido;
- idempotencia e eventos implementados.

Escopo:

- `payment_provider_config` tenant-scoped;
- `payment_attempt` para cobrancas PIX;
- status `PENDING`, `EXPIRED`, `CONFIRMED`, `FAILED`;
- expiracao controlada de cobrancas;
- webhook para confirmacao;
- reconciliacao basica entre evento do PSP e invoice.

Nao fazer nesta fase sem decisao explicita:

- parcelamento;
- split de pagamento;
- antecipacao;
- regras fiscais automaticas.

## Fase 3 - Cartao Debito e Credito

Objetivo: suportar pagamento por cartao com tokenizacao externa e sem armazenar dado sensivel.

Pre-condicoes:

- PSP com tokenizacao e conformidade definidas;
- UI segura para captura/tokenizacao, preferencialmente hosted fields ou redirect;
- regras de estorno/cancelamento desenhadas;
- tratamento de autorizacao, captura e falha.

Escopo:

- `PaymentMethodType.DEBIT_CARD`;
- `PaymentMethodType.CREDIT_CARD`;
- tentativa com `AUTHORIZED`, `CONFIRMED`, `FAILED`, `CANCELED`;
- metadados seguros como bandeira e ultimos quatro digitos;
- eventos de autorizacao/captura/estorno quando o provider suportar.

Nao fazer:

- persistir numero completo, CVV ou dados sensiveis de cartao;
- acoplar PetFlow a SDK especifico de PSP;
- misturar regra de parcelamento no dominio de atendimento.

## Fase 4 - Conciliacao e Webhook

Objetivo: amadurecer operacao financeira para suporte, auditoria e divergencias.

Escopo:

- `payment_event` append-only;
- idempotencia por evento externo;
- conciliacao automatica por referencia, valor, tenant e invoice;
- marcacao de divergencias;
- tela de suporte/operacao para eventos ignorados ou inconsistentes;
- jobs de expiracao e reconciliacao.

Resultado esperado:

- menos confirmacao manual;
- suporte consegue explicar o historico de cada cobranca;
- divergencias ficam visiveis sem quebrar o fluxo de Banho e Tosa.

## Sequencia Recomendada de Implementacao

1. Documentar e validar o modelo com o estado atual do backend/frontend.
2. Se necessario, adicionar `payment_event` primeiro, porque ele melhora auditoria sem mudar UX.
3. Adicionar `payment_attempt` somente quando existir caso de uso de tentativa pendente/expirada.
4. Criar provider `MANUAL`/`NOOP` antes de qualquer PSP real.
5. Evoluir telas PetFlow para mostrar tentativas/eventos sem exigir conhecimento financeiro avancado.
6. Integrar PIX real apenas depois de sandbox, webhook e credenciais estarem prontos.
7. Integrar cartao depois de tokenizacao e desenho de estorno/captura.

## Criterios de Pronto por Fase

Fase 1 esta pronta quando:

- cobranca manual continua funcionando;
- operador consegue registrar pagamento sem ambiguidade;
- documentacao mostra limites do produto;
- mensagens de renovacao nao prometem pagamento online.

Fase 2 esta pronta quando:

- PIX real pode ser criado, expirar e confirmar via webhook em sandbox;
- tentativa falha/expirada nao quita invoice;
- confirmacao gera pagamento financeiro rastreavel.

Fase 3 esta pronta quando:

- cartao e tokenizado fora do backend;
- autorizacao/captura/erro geram eventos claros;
- dados sensiveis nao aparecem no banco nem nos logs.

Fase 4 esta pronta quando:

- webhooks sao idempotentes;
- divergencias ficam visiveis;
- suporte consegue reconstruir a linha do tempo de uma cobranca.
