# Gestão Pet Banho e Tosa - Decision Log

Data de referência: 2026-05-11.

Este documento registra decisões técnicas relevantes para defesa de TCC, portfolio técnico e apresentação futura.

## DL-001 - Modular monolith como arquitetura base

Decisão: manter backend em modular monolith.

Motivo:

- o projeto precisa demonstrar domínio, arquitetura e produto funcional sem custo de coordenação de microsserviços;
- Spring Boot + pacotes por domínio permitem separar responsabilidades de forma suficiente para o estagio atual;
- o TCC se beneficia de uma arquitetura explicável e verificável.

Consequencias:

- deploy e observabilidade são mais simples;
- limites de módulo precisam ser respeitados por convenção, testes e revisão;
- extração futura de serviços continua possível, mas não é premissa da demo.

## DL-002 - Multi-tenancy desde a fundação

Decisão: manter `tenant_id`, tenant context, guards e permissões como requisitos estruturais.

Motivo:

- o produto é apresentado como SaaS;
- retrofit de multi-tenancy costuma ser caro e arriscado;
- isolamento de dados fortalece a narrativa técnica.

Consequencias:

- queries de negócio precisam carregar tenant;
- frontend depende de contexto de workspace;
- testes devem cobrir permissão e isolamento quando a área for crítica.

## DL-003 - Foco comercial em Banho e Tosa

Decisão: a narrativa atual do Gestão Pet e Banho e Tosa, não clínica.

Motivo:

- a demo final precisa ser coesa;
- os fluxos mais fortes do repositório neste momento são agenda, planos, estoque, cobrança, comissão e mensagens preparadas;
- abrir escopo para clínica reduziria clareza comercial e acadêmica.

Consequencias:

- telas e documentos devem priorizar linguagem de banho e tosa;
- recursos clínicos existentes no monorepo não devem ser vendidos como centro da sprint;
- roadmap pode registrar clínica apenas como área adjacente, não como promessa imediata.

## DL-004 - Plano como pacote de sessões

Decisão: modelar planos com modelos comerciais e planos contratados por cliente/pet.

Motivo:

- banho e tosa recorrente é um caso comercial forte;
- sessões restantes geram gatilho claro de renovação;
- separação entre modelo e venda evita duplicar configuração a cada cliente.

Consequencias:

- o frontend mostra catálogo de planos e planos vendidos;
- renovação é orientada por sessões restantes;
- o fluxo ainda não é uma assinatura/gateway completo.

## DL-005 - Multi-serviço por linhas estruturadas

Decisão: preservar atendimento com serviço âncora, mas adicionar linhas estruturadas.

Motivo:

- manter compatibilidade com fluxo inicial;
- permitir pacote realista de banho + tosa + adicional;
- atribuir profissional e comissão por linha.

Consequencias:

- parte do modelo ainda existe por compatibilidade;
- telas precisam mostrar pacote sem confundir usuário;
- calculos de comissão e estoque devem considerar linhas.

## DL-006 - Estoque com aplicação explícita

Decisão: não baixar todo estoque automaticamente apenas por agendar/concluir; permitir consumo esperado, consumo real e aplicação explícita.

Motivo:

- em operação real, consumo pode variar;
- uma baixa automática invisível pode gerar estoque incorreto;
- explicitação ajuda a demo e a auditoria.

Consequencias:

- operador precisa confirmar baixa;
- checklist manual deve validar consumo e movimento;
- alertas de mínimo/reposição ficam mais confiáveis.

## DL-007 - Comissão por snapshot

Decisão: armazenar snapshot de elegibilidade, taxa e valor de comissão nas linhas de atendimento.

Motivo:

- fechamento operacional precisa refletir a regra vigente no momento do atendimento;
- mudanças futuras em cadastro de profissional/serviço não devem reescrever histórico;
- facilita apresentação de produção por profissional.

Consequencias:

- o fechamento é mais estável;
- migrações precisam evoluir campos de linha de serviço;
- casos sem taxa configurada devem aparecer como pendência, não erro oculto.

## DL-008 - Mensagens preparadas antes de integração oficial

Decisão: entregar fluxo manual assistido de mensagens antes de depender de WhatsApp oficial.

Motivo:

- a integração oficial ficou bloqueada por billing externo da Meta;
- ainda havia valor em gerar mensagens com contexto de cliente, pet, plano e cobrança;
- o fluxo manual é demonstrável e honesto.

Consequencias:

- frontend exibe e copia mensagem para envio manual;
- backend retorna nota de segurança indicando que provider externo não foi chamado;
- documentos e apresentação não devem afirmar envio automático oficial.

## DL-009 - Fundação de mensageria em core

Decisão: manter canais, templates, dispatches, eventos e provider de WhatsApp em `core.messaging`.

Motivo:

- mensageria e capacidade transversal;
- Gestão Pet não deve acoplar suas regras diretamente a um provider;
- a base prepara futura ativação quando billing/credenciais estiverem resolvidos.

Consequencias:

- existe schema e API técnica para WhatsApp;
- o fluxo comercial validado continua sendo manual assistido;
- roadmap deve separar "fundação criada" de "envio oficial em uso".

## DL-010 - Documentação honesta para TCC

Decisão: documentar limitações atuais explicitamente.

Motivo:

- TCC e portfolio técnico ganham credibilidade quando limites são claros;
- evita overclaim sobre WhatsApp, PIX, cartão e maturidade operacional;
- ajuda a banca/avaliador a entender evolução incremental.

Consequencias:

- roadmap mostra próximos passos;
- checklist manual evidencia o que está validado;
- apresentação fica alinhada ao estado real do repositório.
