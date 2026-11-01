# Gestão Pet Banho e Tosa - Roadmap Técnico

Data de referência: 2026-05-11.

Este roadmap separa o que já existe, o que está parcialmente estruturado e o que deve ficar para evolução futura. Ele não transforma itens futuros em promessas concluídas.

## Estado Atual Consolidado

Funcionalidades já representadas no produto:

- clientes/responsáveis;
- pets;
- agenda de banho e tosa;
- catálogo de serviços;
- multi-serviço por atendimento;
- profissionais;
- comissão projetada;
- planos e sessões restantes;
- consumo de sessão;
- estoque e movimentações;
- vínculo de estoque por serviço;
- consumo esperado e real por atendimento;
- baixa explícita de estoque;
- faturas e pagamentos;
- dashboard operacional;
- fechamento operacional;
- mensagens preparadas para retirada e renovação;
- fundação técnica de mensageria para WhatsApp.

## Limitações Atuais

- WhatsApp oficial não está validado por bloqueio de billing externo da Meta.
- PIX e dados de cobrança aparecem como texto para fluxo manual, não como gateway integrado.
- Cartão/pagamento online não estão integrados.
- Portal do cliente não faz parte da demo atual.
- Relatórios gerenciais avancados ainda podem evoluir.
- A narrativa clínica não é foco da sprint atual.

## Curto Prazo

Objetivo: fortalecer apresentação e validação operacional.

- Melhorar dados seed de demo para cobrir:
  - um cliente recorrente;
  - um atendimento avulso;
  - um plano no penúltimo/último uso;
  - um item abaixo do mínimo;
  - uma cobrança pendente;
  - um profissional com comissão.
- Refinar textos do produto em portugues, mantendo consistência com Banho e Tosa.
- Expandir testes focados nos fluxos de plano, estoque e mensagens preparadas.
- Criar roteiro de apresentação com prints e ordem sugerida.
- Revisar documentação técnica antes da entrega acadêmica.

## Médio Prazo

Objetivo: transformar a demo em produto operacional mais completo.

- Criar relatórios de fechamento por período.
- Melhorar filtros de agenda e visões por profissional.
- Evoluir cobrança para reconciliação mais clara de pagamentos.
- Melhorar alertas de renovação com priorização por data/sessão.
- Adicionar trilha de auditoria mais visível para ações críticas de estoque.
- Preparar ambiente controlado para validar WhatsApp quando billing externo estiver liberado.

## Longo Prazo

Objetivo: preparar expansão de produto sem quebrar a fundação.

- Ativar envio oficial de WhatsApp Cloud API após resolver billing, credenciais e políticas de template.
- Evoluir mensagens para templates aprovados e rastreio de entrega.
- Avaliar gateway de pagamento real somente quando houver escopo fiscal/financeiro adequado.
- Criar portal do cliente para consulta de plano, agendamentos e histórico.
- Evoluir relatórios para BI leve: recorrência, churn de planos, ticket médio, consumo de estoque e produtividade.
- Avaliar extração de mensageria ou financeiro para serviços dedicados apenas se volume/complexidade justificar.

## Criterios de Priorização

Priorizar itens que:

- reduzam trabalho manual da recepção;
- aumentem clareza do fechamento operacional;
- diminuam risco de estoque incorreto;
- melhorem renovação de planos;
- sejam demonstráveis sem depender de fornecedor externo;
- preservem tenant isolation e permissões.

Evitar itens que:

- dependam de integrações externas ainda bloqueadas;
- abram escopo de clínica sem necessidade;
- refatorem arquitetura sem ganho demonstrável;
- misturem CRM genérico com a narrativa principal de Banho e Tosa.

## Marco de Pronto para Apresentação

O Gestão Pet pode ser apresentado tecnicamente quando:

- dashboard mostra a operação do dia;
- agenda possui atendimento recorrente e avulso;
- plano perto do fim gera mensagem preparada;
- estoque baixo fica visível;
- atendimento concluído gera leitura de comissão;
- cobrança pendente aparece no fechamento;
- limitações de WhatsApp/pagamento online são explicadas com clareza;
- checklist manual foi executado com evidencias.
