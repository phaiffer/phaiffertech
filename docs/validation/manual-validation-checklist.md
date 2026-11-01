# Gestão Pet Banho e Tosa - Checklist de Validação Manual

Data de referência: 2026-05-11.

Este checklist ajuda a validar a demo e o fluxo operacional sem depender de integrações externas. Ele assume ambiente local/dev com usuário que possua permissões Gestão Pet.

## Preparação

- [ ] Backend iniciado sem erro.
- [ ] Frontend iniciado sem erro.
- [ ] Login realizado no tenant de demo.
- [ ] Módulo Gestão Pet visível na navegação.
- [ ] Navegação principal aponta para a experiência de Banho e Tosa.

## Dashboard Operacional

- [ ] Abrir `/pet/dashboard`.
- [ ] Confirmar que o texto da tela fala de fila, recorrência, estoque, cobrança e comissão.
- [ ] Ver cards de atendimentos do dia, recorrentes vs avulsos, próximo ciclo e comissão.
- [ ] Ver bloco de fechamento operacional com:
  - atendimentos concluídos;
  - comissão para conferir;
  - planos perto do fim;
  - cobranças pendentes.
- [ ] Confirmar que alertas de estoque baixo aparecem quando existem itens no ponto de reposição.
- [ ] Confirmar que a tela não depende de WhatsApp oficial para ser apresentada.

## Clientes e Pets

- [ ] Criar ou localizar um cliente ativo.
- [ ] Confirmar telefone/email quando a demo precisar de mensagens preparadas.
- [ ] Criar ou localizar pet vinculado ao cliente.
- [ ] Preencher dados úteis para Banho e Tosa: porte, pelagem, comportamento, restrições e observações.

## Serviços

- [ ] Abrir catálogo de serviços.
- [ ] Criar ou revisar serviços como banho, tosa, tosa higiênica e adicionais.
- [ ] Confirmar preço, duração e categoria.
- [ ] Confirmar se o serviço permite plano e/ou atendimento avulso.
- [ ] Confirmar elegibilidade de comissão.
- [ ] Se aplicável, vincular itens de estoque ao serviço.

## Profissionais e Comissão

- [ ] Abrir equipe/profissionais.
- [ ] Confirmar profissionais ativos.
- [ ] Configurar taxa de comissão para pelo menos um profissional.
- [ ] Abrir resumo/fechamento de comissão.
- [ ] Confirmar que atendimentos concluídos aparecem como produção/comissão quando existem dados.

## Planos

- [ ] Abrir `/pet/plans`.
- [ ] Confirmar existência de catálogo/modelo de plano.
- [ ] Criar ou revisar um modelo com sessões, preço e validade.
- [ ] Contratar plano para cliente/pet.
- [ ] Confirmar sessões totais, usadas e restantes.
- [ ] Validar alertas de penúltimo ou último uso.
- [ ] Preparar mensagem de renovação.
- [ ] Confirmar que a mensagem é exibida para revisão e envio manual.
- [ ] Confirmar que a tela não afirma envio por gateway ou WhatsApp oficial.

## Agenda e Multi-Serviço

- [ ] Abrir `/pet/appointments`.
- [ ] Agendar atendimento avulso.
- [ ] Agendar atendimento vinculado a plano.
- [ ] Criar atendimento com mais de um serviço.
- [ ] Atribuir profissional por linha quando necessário.
- [ ] Confirmar que a tabela mostra recorrente/avulso, pet, cliente, profissional, plano e valor previsto.
- [ ] Mover atendimento para concluído.
- [ ] Confirmar consumo de sessão do plano quando aplicável.
- [ ] Preparar mensagem de retirada para atendimento concluído.
- [ ] Confirmar que a mensagem e copiável/editável para envio manual.

## Estoque

- [ ] Abrir `/pet/inventory`.
- [ ] Confirmar cards de produtos monitorados, abaixo do mínimo, reposição e saídas.
- [ ] Ver item abaixo do mínimo destacado visualmente.
- [ ] Ver item no ponto de reposição destacado visualmente.
- [ ] Registrar entrada de reposição.
- [ ] Registrar saída manual ou consumo.
- [ ] Confirmar que o saldo muda e que o histórico apresenta motivo/origem.

## Consumo de Estoque por Atendimento

- [ ] Abrir atendimento com serviço vinculado a estoque.
- [ ] Conferir consumo esperado.
- [ ] Ajustar consumo real se necessário.
- [ ] Aplicar baixa explicitamente.
- [ ] Confirmar movimento de estoque gerado.
- [ ] Confirmar que baixa duplicada não é a expectativa operacional.

## Cobrança

- [ ] Abrir `/pet/invoices`.
- [ ] Confirmar faturas emitidas, pagas, parcialmente pagas ou vencidas quando existirem.
- [ ] Conferir saldo em aberto.
- [ ] Conferir previsão do próximo ciclo quando houver agenda/plano.
- [ ] Confirmar que PIX aparece apenas como informação textual, sem gateway integrado.

## Follow-up

- [ ] Abrir follow-up do Gestão Pet.
- [ ] Confirmar linguagem de Banho e Tosa.
- [ ] Validar tarefas, notas e atividade como apoio a retirada, retorno, renovação ou pendência operacional.
- [ ] Confirmar que a tela não vira narrativa de CRM genérico.

## Mensageria

- [ ] Confirmar que mensagens preparadas funcionam sem canal externo.
- [ ] Confirmar que a configuração de templates aceita dados de cobrança textual.
- [ ] Confirmar que o envio oficial por WhatsApp não é apresentado como concluído.
- [ ] Se algum endpoint de WhatsApp for avaliado tecnicamente, tratar como fundação criada e não como fluxo comercial validado.

## Evidencias para TCC

- [ ] Capturar prints do dashboard operacional.
- [ ] Capturar prints de plano perto do fim.
- [ ] Capturar prints de estoque baixo/reposição.
- [ ] Capturar prints de agenda multi-serviço.
- [ ] Capturar prints de mensagem preparada de retirada.
- [ ] Capturar prints de mensagem preparada de renovação.
- [ ] Registrar limitações atuais com honestidade: WhatsApp oficial e pagamento online não concluídos.
