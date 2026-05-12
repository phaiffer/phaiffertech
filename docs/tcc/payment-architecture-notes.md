# TCC - Notas de Arquitetura de Pagamentos

Data de referencia: 2026-05-12.

Estas notas conectam a proposta de pagamentos/cobranca ao roadmap academico do PetFlow Banho e Tosa. O objetivo e explicar uma fundacao futura sem afirmar que gateway, PIX dinamico ou cartao real ja estao prontos.

## Posicionamento no TCC

O PetFlow demonstra uma operacao de Banho e Tosa com agenda, planos, estoque, comissao, cobranca e mensagens preparadas. A camada de pagamentos deve ser apresentada como evolucao da cobranca operacional, nao como entrega de integracao financeira externa.

Estado real:

- faturas e pagamentos existem na base financeira compartilhada;
- faturas PetFlow usam especializacao em `pet_invoices`;
- renovacao de plano pode preparar mensagem com dados de cobranca;
- PIX aparece como informacao textual para pagamento manual;
- WhatsApp oficial ainda nao esta validado ponta a ponta por bloqueio de billing externo da Meta;
- cartao e pagamento online ainda nao estao integrados.

## Decisao Arquitetural

A decisao recomendada e tratar pagamento como camada generica de cobranca:

- invoice representa o valor a receber;
- metodo representa a forma possivel de pagamento;
- tentativa representa uma execucao por metodo/provedor;
- evento registra fatos e integra suporte/conciliacao;
- provider externo fica atras de interface.

Essa abordagem evita um "modulo PIX" prematuro. PIX, debito, credito e manual passam a ser variacoes do mesmo ciclo de cobranca.

## Relacao com Banho e Tosa

Os principais contextos de cobranca do PetFlow sao:

- atendimento avulso;
- extras de atendimento;
- renovacao de plano;
- fechamento mensal ou operacional;
- pagamento manual confirmado pela recepcao.

Esses contextos devem continuar em `modules.pet`, enquanto os conceitos financeiros reutilizaveis ficam em `core.finance`.

## Narrativa Recomendada

Para apresentacao:

1. Mostrar que o produto resolve a operacao do dia: agenda, plano, estoque e cobranca.
2. Explicar que a cobranca atual e manual assistida, adequada para demo e validacao.
3. Mostrar que o backend ja separa PetFlow de financeiro compartilhado.
4. Apresentar a evolucao para tentativas/eventos/providers como arquitetura futura.
5. Deixar claro que PIX dinamico, cartao e webhooks sao fases futuras.

## Riscos Controlados

- Evita depender de PSP durante a entrega academica.
- Evita prometer WhatsApp oficial enquanto ha bloqueio externo.
- Evita armazenar dados sensiveis de cartao.
- Evita refatorar `pet.invoice` antes de haver ganho demonstravel.
- Mantem o foco em Banho e Tosa, sem expandir para clinica.

## Referencias Internas

- [Visao da camada de cobranca](../payments/payment-layer-overview.md)
- [Modelo de dominio de pagamentos](../payments/payment-domain-model.md)
- [Roadmap incremental de pagamentos](../payments/payment-roadmap.md)
- [Roadmap tecnico do TCC](roadmap.md)
- [Decision log](decision-log.md)

