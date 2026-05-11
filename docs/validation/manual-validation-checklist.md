# PetFlow Banho e Tosa - Checklist de Validacao Manual

Data de referencia: 2026-05-11.

Este checklist ajuda a validar a demo e o fluxo operacional sem depender de integracoes externas. Ele assume ambiente local/dev com usuario que possua permissoes PetFlow.

## Preparacao

- [ ] Backend iniciado sem erro.
- [ ] Frontend iniciado sem erro.
- [ ] Login realizado no tenant de demo.
- [ ] Modulo PetFlow visivel na navegacao.
- [ ] Navegacao principal aponta para a experiencia de Banho e Tosa.

## Dashboard Operacional

- [ ] Abrir `/pet/dashboard`.
- [ ] Confirmar que o texto da tela fala de fila, recorrencia, estoque, cobranca e comissao.
- [ ] Ver cards de atendimentos do dia, recorrentes vs avulsos, proximo ciclo e comissao.
- [ ] Ver bloco de fechamento operacional com:
  - atendimentos concluidos;
  - comissao para conferir;
  - planos perto do fim;
  - cobrancas pendentes.
- [ ] Confirmar que alertas de estoque baixo aparecem quando existem itens no ponto de reposicao.
- [ ] Confirmar que a tela nao depende de WhatsApp oficial para ser apresentada.

## Clientes e Pets

- [ ] Criar ou localizar um cliente ativo.
- [ ] Confirmar telefone/email quando a demo precisar de mensagens preparadas.
- [ ] Criar ou localizar pet vinculado ao cliente.
- [ ] Preencher dados uteis para Banho e Tosa: porte, pelagem, comportamento, restricoes e observacoes.

## Servicos

- [ ] Abrir catalogo de servicos.
- [ ] Criar ou revisar servicos como banho, tosa, tosa higienica e adicionais.
- [ ] Confirmar preco, duracao e categoria.
- [ ] Confirmar se o servico permite plano e/ou atendimento avulso.
- [ ] Confirmar elegibilidade de comissao.
- [ ] Se aplicavel, vincular itens de estoque ao servico.

## Profissionais e Comissao

- [ ] Abrir equipe/profissionais.
- [ ] Confirmar profissionais ativos.
- [ ] Configurar taxa de comissao para pelo menos um profissional.
- [ ] Abrir resumo/fechamento de comissao.
- [ ] Confirmar que atendimentos concluidos aparecem como producao/comissao quando existem dados.

## Planos

- [ ] Abrir `/pet/plans`.
- [ ] Confirmar existencia de catalogo/modelo de plano.
- [ ] Criar ou revisar um modelo com sessoes, preco e validade.
- [ ] Contratar plano para cliente/pet.
- [ ] Confirmar sessoes totais, usadas e restantes.
- [ ] Validar alertas de penultimo ou ultimo uso.
- [ ] Preparar mensagem de renovacao.
- [ ] Confirmar que a mensagem e exibida para revisao e envio manual.
- [ ] Confirmar que a tela nao afirma envio por gateway ou WhatsApp oficial.

## Agenda e Multi-Servico

- [ ] Abrir `/pet/appointments`.
- [ ] Agendar atendimento avulso.
- [ ] Agendar atendimento vinculado a plano.
- [ ] Criar atendimento com mais de um servico.
- [ ] Atribuir profissional por linha quando necessario.
- [ ] Confirmar que a tabela mostra recorrente/avulso, pet, cliente, profissional, plano e valor previsto.
- [ ] Mover atendimento para concluido.
- [ ] Confirmar consumo de sessao do plano quando aplicavel.
- [ ] Preparar mensagem de retirada para atendimento concluido.
- [ ] Confirmar que a mensagem e copiavel/editavel para envio manual.

## Estoque

- [ ] Abrir `/pet/inventory`.
- [ ] Confirmar cards de produtos monitorados, abaixo do minimo, reposicao e saidas.
- [ ] Ver item abaixo do minimo destacado visualmente.
- [ ] Ver item no ponto de reposicao destacado visualmente.
- [ ] Registrar entrada de reposicao.
- [ ] Registrar saida manual ou consumo.
- [ ] Confirmar que o saldo muda e que o historico apresenta motivo/origem.

## Consumo de Estoque por Atendimento

- [ ] Abrir atendimento com servico vinculado a estoque.
- [ ] Conferir consumo esperado.
- [ ] Ajustar consumo real se necessario.
- [ ] Aplicar baixa explicitamente.
- [ ] Confirmar movimento de estoque gerado.
- [ ] Confirmar que baixa duplicada nao e a expectativa operacional.

## Cobranca

- [ ] Abrir `/pet/invoices`.
- [ ] Confirmar faturas emitidas, pagas, parcialmente pagas ou vencidas quando existirem.
- [ ] Conferir saldo em aberto.
- [ ] Conferir previsao do proximo ciclo quando houver agenda/plano.
- [ ] Confirmar que PIX aparece apenas como informacao textual, sem gateway integrado.

## Follow-up

- [ ] Abrir follow-up do PetFlow.
- [ ] Confirmar linguagem de Banho e Tosa.
- [ ] Validar tarefas, notas e atividade como apoio a retirada, retorno, renovacao ou pendencia operacional.
- [ ] Confirmar que a tela nao vira narrativa de CRM generico.

## Mensageria

- [ ] Confirmar que mensagens preparadas funcionam sem canal externo.
- [ ] Confirmar que a configuracao de templates aceita dados de cobranca textual.
- [ ] Confirmar que o envio oficial por WhatsApp nao e apresentado como concluido.
- [ ] Se algum endpoint de WhatsApp for avaliado tecnicamente, tratar como fundacao criada e nao como fluxo comercial validado.

## Evidencias para TCC

- [ ] Capturar prints do dashboard operacional.
- [ ] Capturar prints de plano perto do fim.
- [ ] Capturar prints de estoque baixo/reposicao.
- [ ] Capturar prints de agenda multi-servico.
- [ ] Capturar prints de mensagem preparada de retirada.
- [ ] Capturar prints de mensagem preparada de renovacao.
- [ ] Registrar limitacoes atuais com honestidade: WhatsApp oficial e pagamento online nao concluidos.
