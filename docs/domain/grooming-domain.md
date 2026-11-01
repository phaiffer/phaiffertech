# Gestão Pet Banho e Tosa - Modelagem de Domínio

Data de referência: 2026-05-11.

Este documento descreve o domínio funcional de Banho e Tosa implementado no Gestão Pet. O objetivo é apoiar apresentação técnica, TCC e validação manual sem afirmar funcionalidades que ainda não estão prontas.

## Linguagem Ubíqua

- Cliente/responsável: pessoa responsável pelo pet e pela cobrança.
- Pet: animal atendido pela operação.
- Atendimento: horário/agendamento executado pela equipe.
- Linha de serviço: serviço individual dentro de um atendimento multi-serviço.
- Catálogo de serviços: banho, tosa e adicionais configuráveis.
- Profissional: pessoa responsável por executar uma ou mais linhas.
- Plano: pacote recorrente de sessões vendido para cliente/pet.
- Sessão: unidade consumível do plano.
- Estoque: produtos e insumos usados na execução ou vendidos no balcão.
- Consumo esperado: receita de estoque definida no serviço.
- Consumo real: quantidade registrada durante o atendimento.
- Baixa de estoque: movimento aplicado explicitamente ao inventário.
- Fatura/cobrança: registro financeiro do atendimento, extra ou renovação.
- Mensagem preparada: texto gerado para revisão e envio manual.

## Agregados e Entidades Principais

### Cliente

Representa o responsável comercial. Possui dados de contato, documento, endereço, status e informações de responsável principal.

Responsabilidades:

- servir como raiz de contato para agenda, pet, plano e cobrança;
- permitir busca operacional por recepção;
- fornecer email/telefone para mensagens preparadas.

### Pet

Vinculado a um cliente. Guarda dados operacionais como espécie, porte, pelagem, comportamento, restrições e observações de banho e tosa.

Responsabilidades:

- qualificar o atendimento;
- carregar histórico operacional;
- permitir montagem de plano por cliente/pet.

### Catálogo de Serviços

Define serviços que podem ser agendados. O modelo atual possui:

- categoria de serviço;
- preço base;
- duração estimada;
- flags para permitir plano ou atendimento avulso;
- elegibilidade de comissão;
- vínculos com itens de estoque.

Responsabilidades:

- padronizar oferta comercial;
- evitar texto solto na agenda;
- servir de base para comissão, preço e consumo de estoque.

### Atendimento

Representa a execução agendada. Inclui cliente, pet, profissional âncora, status, horário, observações, plano opcional, extras e valores.

Estados observados no frontend:

- agendado;
- confirmado;
- em andamento;
- concluído;
- cancelado;
- não compareceu.

Responsabilidades:

- organizar a fila de banho e tosa;
- conectar plano, serviços, profissionais, estoque e cobrança;
- permitir preparação de mensagem de retirada quando o pet fica pronto.

### Linha de Serviço

Permite multi-serviço dentro do atendimento. Cada linha pode ter profissional responsável próprio, preço e snapshot de comissão.

Responsabilidades:

- preservar compatibilidade com atendimento antigo;
- permitir pacote como "banho + tosa higiênica + adicional";
- distribuir responsabilidade e comissão por linha.

### Profissional

Representa groomers, tosadores e equipe operacional. Pode ter taxa de comissão.

Responsabilidades:

- aparecer na agenda e na fila;
- orientar fechamento por produção;
- permitir calculo projetado de comissão.

### Plano

O fluxo atual separa modelo comercial de plano contratado.

- `pet_plan_templates`: oferta reutilizável, com preço, validade, sessões e serviços.
- `pet_client_plans`: plano vendido para cliente/pet, com sessões totais, usadas e restantes.

Responsabilidades:

- controlar recorrência;
- destacar penúltimo/último uso;
- apoiar renovação manual assistida;
- impedir que toda operação dependa de planilha.

### Estoque

O estoque usa fundação compartilhada:

- itens de inventário;
- movimentos;
- vínculo produto pet -> item de inventário;
- receita de consumo por serviço;
- snapshot de consumo esperado/real no atendimento.

Responsabilidades:

- alertar itens abaixo do mínimo ou ponto de reposição;
- registrar entrada/saída;
- aplicar baixa a partir do atendimento quando o operador confirma;
- manter rastreabilidade entre serviço e estoque.

### Cobrança

Faturas e pagamentos registram o saldo financeiro da operação. A renovação de plano pode preparar uma fatura de renovação e exibir valor, status e dados de cobrança no frontend.

Importante: não há gateway PIX/cartão concluído. PIX e chave/nome de cobrança são dados textuais para o fluxo manual.

### Mensagens Preparadas

Mensagens preparadas existem para dois momentos:

- retirada de pet pronto;
- renovação de plano.

Elas usam templates e variáveis, são exibidas ao usuário e copiadas para envio manual. O próprio backend retorna uma nota de segurança indicando que nenhum provider externo ou gateway PIX foi acionado.

## Fluxos Operacionais Principais

### Cadastro base

1. Cadastrar cliente.
2. Cadastrar pet vinculado ao cliente.
3. Cadastrar serviços de banho e tosa.
4. Cadastrar profissionais.
5. Opcionalmente cadastrar produtos e vínculos de estoque.

### Agendamento avulso

1. Selecionar cliente e pet.
2. Selecionar serviço ou pacote multi-serviço.
3. Definir profissional responsável.
4. Informar data/hora, extras e observações.
5. Salvar atendimento.
6. Executar e concluir.
7. Conferir cobrança e comissão.

### Agendamento com plano

1. Criar modelo de plano.
2. Contratar plano para cliente/pet.
3. Agendar atendimento vinculado ao plano.
4. Concluir atendimento.
5. Consumir sessão.
6. Quando restarem poucas sessões, preparar renovação manual assistida.

### Consumo de estoque por atendimento

1. Configurar consumo esperado no serviço.
2. Criar atendimento com esse serviço.
3. Ajustar consumo real quando necessário.
4. Aplicar baixa explicitamente.
5. Verificar movimento no estoque e alertas de reposição.

### Fechamento operacional

1. Conferir atendimentos concluídos.
2. Conferir comissão projetada.
3. Ver planos perto do fim.
4. Ver cobranças pendentes.
5. Revisar mensagens preparadas para retirada ou renovação.

## Regras e Invariantes Importantes

- Dados de negócio são tenant-scoped.
- Soft delete preserva histórico.
- Serviços podem ser impedidos de plano ou de atendimento avulso por flags.
- Comissão depende da elegibilidade do serviço e taxa do profissional.
- Snapshot de comissão protege fechamento contra mudanças futuras no cadastro.
- Baixa de estoque por atendimento é explícita, não totalmente automática.
- Mensagem preparada não equivale a envio externo.

## Fora do Escopo Atual

- Clínica veterinária como narrativa principal.
- WhatsApp oficial validado.
- Gateway PIX/cartão.
- Portal do cliente.
- Automações avancadas de marketing.
- Relatórios analíticos completos.
