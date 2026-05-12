# PetFlow Payments - Visao da Camada de Cobranca

Data de referencia: 2026-05-12.

Este documento planeja a camada de pagamentos/cobranca do PetFlow para a proxima fase do produto. Ele reflete o estado real do monorepo PhaifferTech: hoje existe cobranca manual assistida, faturas e pagamentos em `core.finance`, especializacao PetFlow em `modules.pet.invoice` e renovacao com dados PIX textuais em fluxo manual. Nao ha gateway PIX/cartao integrado, nao ha PIX dinamico e a validacao oficial via WhatsApp ainda depende do desbloqueio de billing externo da Meta.

## Objetivo

A camada deve tratar pagamento como uma capacidade generica de cobranca, nao como um modulo PIX. O PetFlow precisa conseguir emitir ou reutilizar uma cobranca, registrar uma ou mais tentativas de pagamento, confirmar manualmente recebimentos e, no futuro, conectar provedores externos sem mudar o fluxo operacional de Banho e Tosa.

Escopo desta trilha:

- preservar o fluxo manual atual;
- preparar dominio para PIX, debito, credito e manual;
- documentar entidades, status, servicos e ciclo de vida;
- orientar implementacao incremental;
- manter o foco em Banho e Tosa, sem abrir escopo para clinica.

Fora do escopo desta trilha:

- integracao real com PSP/gateway;
- geracao de PIX dinamico;
- captura, autorizacao ou tokenizacao real de cartao;
- conciliacao bancaria automatica;
- refatoracao oportunista de modulos existentes.

## Estado Atual do Produto

O produto ja possui fundacao financeira compartilhada:

- `finance_invoices`: faturas tenant-scoped com modulo de origem, contraparte, contexto de negocio, valor, status e dados fiscais basicos.
- `finance_payments`: registros de pagamento ligados a fatura, com metodo, status, valor, referencia e observacoes.
- `finance_cash_movements`: movimentacoes de caixa relacionadas a pagamentos confirmados.
- `pet_invoices`: especializacao PetFlow que liga a cobranca ao cliente/pet e usa `finance_invoice_id`.
- `pet_billing_message_settings`: configuracao textual de cobranca para mensagens preparadas, incluindo chave PIX textual e nome de exibicao.

O fluxo validado hoje e manual assistido:

1. O operador cria ou reutiliza uma fatura PetFlow.
2. A renovacao de plano pode preparar mensagem com valor, contexto e dados PIX textuais.
3. O frontend exibe/copia a mensagem para revisao e envio manual.
4. Quando o cliente paga por fora do sistema, o operador registra o pagamento.
5. O pagamento confirmado atualiza o saldo da fatura e pode gerar movimento de caixa.

Essa base deve continuar funcionando mesmo depois da chegada de provedores externos.

## Arquitetura Proposta

A camada proposta fica como extensao do `core.finance`, com adaptadores especificos em modulos verticais apenas quando houver contexto de negocio. A regra principal e:

- `core.finance`: dono de invoice, metodo, tentativa, provider config, evento e contratos de provider.
- `modules.pet.invoice`: dono da leitura/acao PetFlow, ligando cobranca a cliente, pet, plano, atendimento e mensagens.
- `modules.pet.billing`: dono dos templates e textos operacionais para envio manual assistido.
- `core.messaging`: continua separado, usado para envio/notificacao quando disponivel, sem virar dependencia para pagamento.

Fluxo de dependencia esperado:

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

Nenhum provider real deve ser chamado nesta fase. O primeiro provider concreto pode ser `ManualPaymentProvider` ou `NoopPaymentProvider`, responsavel apenas por registrar eventos internos e manter comportamento previsivel para demo/TCC.

## Conceitos Principais

### Billing Invoice

Representa a cobranca a receber. No codigo atual, `finance_invoices` ja cumpre boa parte desse papel. A proposta usa o nome conceitual `billing_invoice` para deixar claro o modelo de destino, mas a implementacao pode evoluir a partir de `finance_invoices` para evitar migracao desnecessaria.

Uma invoice deve ser independente do meio de pagamento. Ela diz quem deve, quanto deve, por qual contexto e em qual status esta.

### Payment Method

Representa uma forma de pagamento disponivel ou escolhida para uma cobranca. Pode ser manual, PIX, cartao de debito ou cartao de credito. Para cartao real futuro, o sistema nao deve armazenar dados sensiveis; deve guardar apenas token/alias do provider, ultimos digitos quando aplicavel, bandeira e metadados seguros.

### Payment Attempt

Representa uma tentativa concreta de cobrar uma invoice por um metodo e canal/provedor. Uma invoice pode ter varias tentativas: por exemplo, uma tentativa PIX expirada, seguida de pagamento manual confirmado.

### Payment Provider Config

Guarda configuracao tenant-scoped do provedor ou canal. Na fase manual, pode guardar apenas dados exibiveis como chave PIX textual e nome de cobranca. No futuro, credenciais reais devem ir para Secret Manager/ambiente seguro, mantendo no banco apenas referencias e status de configuracao.

### Payment Event

Registra fatos de ciclo de vida: invoice emitida, tentativa criada, pagamento confirmado manualmente, tentativa expirada, evento recebido de webhook, erro de provider. Serve para auditoria, suporte e conciliacao futura.

## Ciclo de Vida da Cobranca

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

`PARTIALLY_PAID`, `OVERDUE` e `VOID` sao extensoes futuras. Elas nao precisam ser adicionadas antes de haver tela/regra que realmente use esses estados.

Estados sugeridos para tentativa:

```text
CREATED -> PENDING -> REQUIRES_ACTION -> AUTHORIZED -> CONFIRMED
        -> FAILED
        -> EXPIRED
        -> CANCELED
        -> REFUNDED
```

Compatibilidade com `FinancePaymentStatus` atual:

- `PENDING`: pagamento registrado mas ainda nao confirmado.
- `CONFIRMED`: pagamento recebido/confirmado.
- `CANCELED`: pagamento cancelado.

O ponto importante e nao confundir pagamento confirmado (`finance_payments`) com tentativa de pagamento (`payment_attempt`). A tentativa pode falhar ou expirar sem gerar pagamento confirmado.

## Encaixe no Monorepo Atual

Implementacao incremental recomendada:

1. Manter `finance_invoices` e `finance_payments` como base operacional atual.
2. Criar novas tabelas de tentativa/evento/configuracao quando houver necessidade real.
3. Evitar renomear `finance_invoices` para `billing_invoice` nesta fase; usar o nome conceitual nos docs e preservar a compatibilidade fisica.
4. Adicionar services/interfaces em `core.finance.payment` ou pacote equivalente, sem alterar controllers PetFlow antes de haver caso de uso.
5. Expor no PetFlow apenas leituras e acoes coerentes com a operacao de Banho e Tosa: emitir cobranca, preparar mensagem, registrar pagamento manual, visualizar tentativas e eventos.

## Compatibilidade Manual

O fluxo manual atual continua sendo o primeiro canal suportado. Ele deve ser modelado como:

- `PaymentMethodType.MANUAL` para recebimento por fora do sistema;
- `PaymentChannel.MANUAL_OPERATOR` para acao feita pelo usuario;
- `PaymentProvider.MANUAL` ou `NOOP`;
- `PaymentAttemptStatus.CONFIRMED` apenas quando o operador confirma recebimento;
- `payment_event` registrando quem confirmou, quando, valor, observacao e referencia.

PIX textual atual deve continuar como dado exibivel de configuracao/mensagem, nao como tentativa de PIX dinamico. Quando PIX real chegar, ele entra como novo provider/canal sem substituir o fluxo manual.

