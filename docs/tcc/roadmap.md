# PetFlow Banho e Tosa - Roadmap Tecnico

Data de referencia: 2026-05-11.

Este roadmap separa o que ja existe, o que esta parcialmente estruturado e o que deve ficar para evolucao futura. Ele nao transforma itens futuros em promessas concluidas.

## Estado Atual Consolidado

Funcionalidades ja representadas no produto:

- clientes/responsaveis;
- pets;
- agenda de banho e tosa;
- catalogo de servicos;
- multi-servico por atendimento;
- profissionais;
- comissao projetada;
- planos e sessoes restantes;
- consumo de sessao;
- estoque e movimentacoes;
- vinculo de estoque por servico;
- consumo esperado e real por atendimento;
- baixa explicita de estoque;
- faturas e pagamentos;
- dashboard operacional;
- fechamento operacional;
- mensagens preparadas para retirada e renovacao;
- fundacao tecnica de mensageria para WhatsApp.

## Limitacoes Atuais

- WhatsApp oficial nao esta validado por bloqueio de billing externo da Meta.
- PIX e dados de cobranca aparecem como texto para fluxo manual, nao como gateway integrado.
- Cartao/pagamento online nao estao integrados.
- Portal do cliente nao faz parte da demo atual.
- Relatorios gerenciais avancados ainda podem evoluir.
- A narrativa clinica nao e foco da sprint atual.

## Curto Prazo

Objetivo: fortalecer apresentacao e validacao operacional.

- Melhorar dados seed de demo para cobrir:
  - um cliente recorrente;
  - um atendimento avulso;
  - um plano no penultimo/ultimo uso;
  - um item abaixo do minimo;
  - uma cobranca pendente;
  - um profissional com comissao.
- Refinar textos do produto em portugues, mantendo consistencia com Banho e Tosa.
- Expandir testes focados nos fluxos de plano, estoque e mensagens preparadas.
- Criar roteiro de apresentacao com prints e ordem sugerida.
- Revisar documentacao tecnica antes da entrega academica.

## Medio Prazo

Objetivo: transformar a demo em produto operacional mais completo.

- Criar relatorios de fechamento por periodo.
- Melhorar filtros de agenda e visoes por profissional.
- Evoluir cobranca para reconciliacao mais clara de pagamentos.
- Melhorar alertas de renovacao com priorizacao por data/sessao.
- Adicionar trilha de auditoria mais visivel para acoes criticas de estoque.
- Preparar ambiente controlado para validar WhatsApp quando billing externo estiver liberado.

## Longo Prazo

Objetivo: preparar expansao de produto sem quebrar a fundacao.

- Ativar envio oficial de WhatsApp Cloud API apos resolver billing, credenciais e politicas de template.
- Evoluir mensagens para templates aprovados e rastreio de entrega.
- Avaliar gateway de pagamento real somente quando houver escopo fiscal/financeiro adequado.
- Criar portal do cliente para consulta de plano, agendamentos e historico.
- Evoluir relatorios para BI leve: recorrencia, churn de planos, ticket medio, consumo de estoque e produtividade.
- Avaliar extracao de mensageria ou financeiro para servicos dedicados apenas se volume/complexidade justificar.

## Criterios de Priorizacao

Priorizar itens que:

- reduzam trabalho manual da recepcao;
- aumentem clareza do fechamento operacional;
- diminuam risco de estoque incorreto;
- melhorem renovacao de planos;
- sejam demonstraveis sem depender de fornecedor externo;
- preservem tenant isolation e permissoes.

Evitar itens que:

- dependam de integracoes externas ainda bloqueadas;
- abram escopo de clinica sem necessidade;
- refatorem arquitetura sem ganho demonstravel;
- misturem CRM generico com a narrativa principal de Banho e Tosa.

## Marco de Pronto para Apresentacao

O PetFlow pode ser apresentado tecnicamente quando:

- dashboard mostra a operacao do dia;
- agenda possui atendimento recorrente e avulso;
- plano perto do fim gera mensagem preparada;
- estoque baixo fica visivel;
- atendimento concluido gera leitura de comissao;
- cobranca pendente aparece no fechamento;
- limitacoes de WhatsApp/pagamento online sao explicadas com clareza;
- checklist manual foi executado com evidencias.
