# PetFlow Banho e Tosa - Decision Log

Data de referencia: 2026-05-11.

Este documento registra decisoes tecnicas relevantes para defesa de TCC, portfolio tecnico e apresentacao futura.

## DL-001 - Modular monolith como arquitetura base

Decisao: manter backend em modular monolith.

Motivo:

- o projeto precisa demonstrar dominio, arquitetura e produto funcional sem custo de coordenacao de microservicos;
- Spring Boot + pacotes por dominio permitem separar responsabilidades de forma suficiente para o estagio atual;
- o TCC se beneficia de uma arquitetura explicavel e verificavel.

Consequencias:

- deploy e observabilidade sao mais simples;
- limites de modulo precisam ser respeitados por convencao, testes e revisao;
- extracao futura de servicos continua possivel, mas nao e premissa da demo.

## DL-002 - Multi-tenancy desde a fundacao

Decisao: manter `tenant_id`, tenant context, guards e permissoes como requisitos estruturais.

Motivo:

- o produto e apresentado como SaaS;
- retrofit de multi-tenancy costuma ser caro e arriscado;
- isolamento de dados fortalece a narrativa tecnica.

Consequencias:

- queries de negocio precisam carregar tenant;
- frontend depende de contexto de workspace;
- testes devem cobrir permissao e isolamento quando a area for critica.

## DL-003 - Foco comercial em Banho e Tosa

Decisao: a narrativa atual do PetFlow e Banho e Tosa, nao clinica.

Motivo:

- a demo final precisa ser coesa;
- os fluxos mais fortes do repositorio neste momento sao agenda, planos, estoque, cobranca, comissao e mensagens preparadas;
- abrir escopo para clinica reduziria clareza comercial e academica.

Consequencias:

- telas e documentos devem priorizar linguagem de banho e tosa;
- recursos clinicos existentes no monorepo nao devem ser vendidos como centro da sprint;
- roadmap pode registrar clinica apenas como area adjacente, nao como promessa imediata.

## DL-004 - Plano como pacote de sessoes

Decisao: modelar planos com modelos comerciais e planos contratados por cliente/pet.

Motivo:

- banho e tosa recorrente e um caso comercial forte;
- sessoes restantes geram gatilho claro de renovacao;
- separacao entre modelo e venda evita duplicar configuracao a cada cliente.

Consequencias:

- o frontend mostra catalogo de planos e planos vendidos;
- renovacao e orientada por sessoes restantes;
- o fluxo ainda nao e uma assinatura/gateway completo.

## DL-005 - Multi-servico por linhas estruturadas

Decisao: preservar atendimento com servico ancora, mas adicionar linhas estruturadas.

Motivo:

- manter compatibilidade com fluxo inicial;
- permitir pacote realista de banho + tosa + adicional;
- atribuir profissional e comissao por linha.

Consequencias:

- parte do modelo ainda existe por compatibilidade;
- telas precisam mostrar pacote sem confundir usuario;
- calculos de comissao e estoque devem considerar linhas.

## DL-006 - Estoque com aplicacao explicita

Decisao: nao baixar todo estoque automaticamente apenas por agendar/concluir; permitir consumo esperado, consumo real e aplicacao explicita.

Motivo:

- em operacao real, consumo pode variar;
- uma baixa automatica invisivel pode gerar estoque incorreto;
- explicitacao ajuda a demo e a auditoria.

Consequencias:

- operador precisa confirmar baixa;
- checklist manual deve validar consumo e movimento;
- alertas de minimo/reposicao ficam mais confiaveis.

## DL-007 - Comissao por snapshot

Decisao: armazenar snapshot de elegibilidade, taxa e valor de comissao nas linhas de atendimento.

Motivo:

- fechamento operacional precisa refletir a regra vigente no momento do atendimento;
- mudancas futuras em cadastro de profissional/servico nao devem reescrever historico;
- facilita apresentacao de producao por profissional.

Consequencias:

- o fechamento e mais estavel;
- migracoes precisam evoluir campos de linha de servico;
- casos sem taxa configurada devem aparecer como pendencia, nao erro oculto.

## DL-008 - Mensagens preparadas antes de integracao oficial

Decisao: entregar fluxo manual assistido de mensagens antes de depender de WhatsApp oficial.

Motivo:

- a integracao oficial ficou bloqueada por billing externo da Meta;
- ainda havia valor em gerar mensagens com contexto de cliente, pet, plano e cobranca;
- o fluxo manual e demonstravel e honesto.

Consequencias:

- frontend exibe e copia mensagem para envio manual;
- backend retorna nota de seguranca indicando que provider externo nao foi chamado;
- documentos e apresentacao nao devem afirmar envio automatico oficial.

## DL-009 - Fundacao de mensageria em core

Decisao: manter canais, templates, dispatches, eventos e provider de WhatsApp em `core.messaging`.

Motivo:

- mensageria e capacidade transversal;
- PetFlow nao deve acoplar suas regras diretamente a um provider;
- a base prepara futura ativacao quando billing/credenciais estiverem resolvidos.

Consequencias:

- existe schema e API tecnica para WhatsApp;
- o fluxo comercial validado continua sendo manual assistido;
- roadmap deve separar "fundacao criada" de "envio oficial em uso".

## DL-010 - Documentacao honesta para TCC

Decisao: documentar limitacoes atuais explicitamente.

Motivo:

- TCC e portfolio tecnico ganham credibilidade quando limites sao claros;
- evita overclaim sobre WhatsApp, PIX, cartao e maturidade operacional;
- ajuda a banca/avaliador a entender evolucao incremental.

Consequencias:

- roadmap mostra proximos passos;
- checklist manual evidencia o que esta validado;
- apresentacao fica alinhada ao estado real do repositorio.
