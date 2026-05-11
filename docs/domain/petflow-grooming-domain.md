# PetFlow Banho e Tosa - Modelagem de Dominio

Data de referencia: 2026-05-11.

Este documento descreve o dominio funcional de Banho e Tosa implementado no PetFlow. O objetivo e apoiar apresentacao tecnica, TCC e validacao manual sem afirmar funcionalidades que ainda nao estao prontas.

## Linguagem Ubicua

- Cliente/responsavel: pessoa responsavel pelo pet e pela cobranca.
- Pet: animal atendido pela operacao.
- Atendimento: horario/agendamento executado pela equipe.
- Linha de servico: servico individual dentro de um atendimento multi-servico.
- Catalogo de servicos: banho, tosa e adicionais configuraveis.
- Profissional: pessoa responsavel por executar uma ou mais linhas.
- Plano: pacote recorrente de sessoes vendido para cliente/pet.
- Sessao: unidade consumivel do plano.
- Estoque: produtos e insumos usados na execucao ou vendidos no balcao.
- Consumo esperado: receita de estoque definida no servico.
- Consumo real: quantidade registrada durante o atendimento.
- Baixa de estoque: movimento aplicado explicitamente ao inventario.
- Fatura/cobranca: registro financeiro do atendimento, extra ou renovacao.
- Mensagem preparada: texto gerado para revisao e envio manual.

## Agregados e Entidades Principais

### Cliente

Representa o responsavel comercial. Possui dados de contato, documento, endereco, status e informacoes de responsavel principal.

Responsabilidades:

- servir como raiz de contato para agenda, pet, plano e cobranca;
- permitir busca operacional por recepcao;
- fornecer email/telefone para mensagens preparadas.

### Pet

Vinculado a um cliente. Guarda dados operacionais como especie, porte, pelagem, comportamento, restricoes e observacoes de banho e tosa.

Responsabilidades:

- qualificar o atendimento;
- carregar historico operacional;
- permitir montagem de plano por cliente/pet.

### Catalogo de Servicos

Define servicos que podem ser agendados. O modelo atual possui:

- categoria de servico;
- preco base;
- duracao estimada;
- flags para permitir plano ou atendimento avulso;
- elegibilidade de comissao;
- vinculos com itens de estoque.

Responsabilidades:

- padronizar oferta comercial;
- evitar texto solto na agenda;
- servir de base para comissao, preco e consumo de estoque.

### Atendimento

Representa a execucao agendada. Inclui cliente, pet, profissional ancora, status, horario, observacoes, plano opcional, extras e valores.

Estados observados no frontend:

- agendado;
- confirmado;
- em andamento;
- concluido;
- cancelado;
- nao compareceu.

Responsabilidades:

- organizar a fila de banho e tosa;
- conectar plano, servicos, profissionais, estoque e cobranca;
- permitir preparacao de mensagem de retirada quando o pet fica pronto.

### Linha de Servico

Permite multi-servico dentro do atendimento. Cada linha pode ter profissional responsavel proprio, preco e snapshot de comissao.

Responsabilidades:

- preservar compatibilidade com atendimento antigo;
- permitir pacote como "banho + tosa higienica + adicional";
- distribuir responsabilidade e comissao por linha.

### Profissional

Representa groomers, tosadores e equipe operacional. Pode ter taxa de comissao.

Responsabilidades:

- aparecer na agenda e na fila;
- orientar fechamento por producao;
- permitir calculo projetado de comissao.

### Plano

O fluxo atual separa modelo comercial de plano contratado.

- `pet_plan_templates`: oferta reutilizavel, com preco, validade, sessoes e servicos.
- `pet_client_plans`: plano vendido para cliente/pet, com sessoes totais, usadas e restantes.

Responsabilidades:

- controlar recorrencia;
- destacar penultimo/ultimo uso;
- apoiar renovacao manual assistida;
- impedir que toda operacao dependa de planilha.

### Estoque

O estoque usa fundacao compartilhada:

- itens de inventario;
- movimentos;
- vinculo produto pet -> item de inventario;
- receita de consumo por servico;
- snapshot de consumo esperado/real no atendimento.

Responsabilidades:

- alertar itens abaixo do minimo ou ponto de reposicao;
- registrar entrada/saida;
- aplicar baixa a partir do atendimento quando o operador confirma;
- manter rastreabilidade entre servico e estoque.

### Cobranca

Faturas e pagamentos registram o saldo financeiro da operacao. A renovacao de plano pode preparar uma fatura de renovacao e exibir valor, status e dados de cobranca no frontend.

Importante: nao ha gateway PIX/cartao concluido. PIX e chave/nome de cobranca sao dados textuais para o fluxo manual.

### Mensagens Preparadas

Mensagens preparadas existem para dois momentos:

- retirada de pet pronto;
- renovacao de plano.

Elas usam templates e variaveis, sao exibidas ao usuario e copiadas para envio manual. O proprio backend retorna uma nota de seguranca indicando que nenhum provider externo ou gateway PIX foi acionado.

## Fluxos Operacionais Principais

### Cadastro base

1. Cadastrar cliente.
2. Cadastrar pet vinculado ao cliente.
3. Cadastrar servicos de banho e tosa.
4. Cadastrar profissionais.
5. Opcionalmente cadastrar produtos e vinculos de estoque.

### Agendamento avulso

1. Selecionar cliente e pet.
2. Selecionar servico ou pacote multi-servico.
3. Definir profissional responsavel.
4. Informar data/hora, extras e observacoes.
5. Salvar atendimento.
6. Executar e concluir.
7. Conferir cobranca e comissao.

### Agendamento com plano

1. Criar modelo de plano.
2. Contratar plano para cliente/pet.
3. Agendar atendimento vinculado ao plano.
4. Concluir atendimento.
5. Consumir sessao.
6. Quando restarem poucas sessoes, preparar renovacao manual assistida.

### Consumo de estoque por atendimento

1. Configurar consumo esperado no servico.
2. Criar atendimento com esse servico.
3. Ajustar consumo real quando necessario.
4. Aplicar baixa explicitamente.
5. Verificar movimento no estoque e alertas de reposicao.

### Fechamento operacional

1. Conferir atendimentos concluidos.
2. Conferir comissao projetada.
3. Ver planos perto do fim.
4. Ver cobrancas pendentes.
5. Revisar mensagens preparadas para retirada ou renovacao.

## Regras e Invariantes Importantes

- Dados de negocio sao tenant-scoped.
- Soft delete preserva historico.
- Servicos podem ser impedidos de plano ou de atendimento avulso por flags.
- Comissao depende da elegibilidade do servico e taxa do profissional.
- Snapshot de comissao protege fechamento contra mudancas futuras no cadastro.
- Baixa de estoque por atendimento e explicita, nao totalmente automatica.
- Mensagem preparada nao equivale a envio externo.

## Fora do Escopo Atual

- Clinica veterinaria como narrativa principal.
- WhatsApp oficial validado.
- Gateway PIX/cartao.
- Portal do cliente.
- Automacoes avancadas de marketing.
- Relatorios analiticos completos.
