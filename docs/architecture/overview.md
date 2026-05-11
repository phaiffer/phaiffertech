# PetFlow Banho e Tosa - Visao Geral da Arquitetura

Data de referencia: 2026-05-11.

Este documento descreve a arquitetura real do PetFlow no monorepo PhaifferTech, com foco no produto de Banho e Tosa. Ele nao abre escopo para clinica veterinaria e nao considera integracoes externas como concluidas quando elas ainda dependem de fatores fora do repositorio.

## Contexto

O PetFlow roda dentro de uma plataforma SaaS multi-tenant implementada como modular monolith:

- Backend: Java 21, Spring Boot, Spring Security, JPA, Flyway e PostgreSQL.
- Frontend: Next.js App Router, TypeScript e Tailwind CSS.
- Multi-tenancy: tenant ativo carregado no request e queries tenant-aware.
- Autorizacao: RBAC, permissoes granulares e guards por modulo.
- Evolucao de schema: migracoes Flyway incrementais.

O foco atual do produto e a operacao de banho e tosa: clientes, pets, agenda, catalogo de servicos, profissionais, planos, consumo de sessoes, estoque, cobranca, comissao e mensagens preparadas.

## Organizacao Backend

Raiz de pacote:

```text
com.phaiffertech.platform
```

Camadas principais:

- `shared`: infraestrutura tecnica compartilhada, tenant context, seguranca, paginacao, respostas e utilitarios.
- `core`: autenticacao, tenant, usuarios, IAM, auditoria, modulos, dashboard agregado, inventario compartilhado, financeiro e fundacao de mensageria.
- `modules.pet`: dominios de PetFlow.
- `modules.crm`: usado como faixa de apoio para tarefas, notas e atividade no follow-up, sem se tornar a narrativa principal do produto.

Dominios relevantes para Banho e Tosa:

- `modules.pet.client`
- `modules.pet.petprofile`
- `modules.pet.appointment`
- `modules.pet.servicecatalog`
- `modules.pet.professional`
- `modules.pet.plan`
- `modules.pet.product`
- `modules.pet.invoice`
- `modules.pet.billing`
- `core.inventory`
- `core.finance`
- `core.messaging`

## Organizacao Frontend

As telas principais ficam em:

```text
apps/frontend/src/modules/pet
apps/frontend/src/app/(app)/pet
```

Superficies relevantes para a demo:

- Dashboard operacional: `pet-operations-dashboard.tsx`
- Clientes: `clients-page.tsx`
- Pets: `pet-profiles-page.tsx`
- Agenda: `pet-appointments-page.tsx`
- Catalogo de servicos: `pet-services-page.tsx`
- Planos: `pet-plans-page.tsx`
- Estoque: `pet-inventory-page.tsx`
- Cobranca: `pet-invoices-page.tsx`
- Equipe e comissao: `pet-professionals-page.tsx`, `pet-commission-summary-page.tsx`
- Follow-up operacional: `pet-follow-up-page.tsx`

O dashboard geral da plataforma tambem prioriza a superficie PetFlow quando o modulo esta visivel para o tenant.

## Modelo de Dados em Alto Nivel

O schema evoluiu por migracoes Flyway. As tabelas e conceitos mais importantes para Banho e Tosa incluem:

- `pet_clients`: responsaveis/clientes.
- `pet_profiles`: pets vinculados a clientes.
- `pet_services`: catalogo de servicos de banho e tosa, com flags de plano, avulso e comissao.
- `pet_professionals`: profissionais com taxa de comissao opcional.
- `pet_appointments`: atendimento/agendamento principal.
- `pet_appointment_services`: linhas estruturadas de servico dentro de um atendimento multi-servico.
- `pet_client_plans`: plano contratado por cliente/pet, com sessoes totais/usadas/restantes.
- `pet_plan_templates`: modelos comerciais reutilizaveis de planos.
- `pet_products`: produtos vinculados ao catalogo pet.
- `inventory_items` e `inventory_movements`: fundacao compartilhada de estoque.
- `pet_service_inventory_links`: receita/consumo esperado por servico.
- `pet_appointment_service_inventory`: snapshot e consumo real por linha de atendimento.
- `pet_invoices` e pagamentos relacionados: cobranca operacional.
- `pet_billing_message_settings`: configuracao de textos e dados de cobranca para mensagens preparadas.
- `message_channels`, `message_template_mappings`, `message_dispatches`, `message_delivery_events`: fundacao tecnica de mensageria.

## Fluxos Arquiteturais

### Agenda e multi-servico

O atendimento possui um servico ancora para compatibilidade com o modelo inicial, mas tambem pode ter linhas estruturadas em `pet_appointment_services`. Cada linha preserva servico, preco, elegibilidade de comissao e profissional responsavel quando informado.

### Plano e consumo de sessao

Um atendimento pode ser vinculado a um plano de cliente. A conclusao do atendimento consome sessao do plano quando aplicavel. O frontend destaca planos com poucas sessoes restantes, principalmente o penultimo e ultimo uso.

### Estoque

O catalogo de servicos pode possuir vinculos de consumo esperado com itens de estoque. Durante o atendimento, o operador pode registrar consumo real e aplicar a baixa de estoque explicitamente. O rollout atual nao trata todo consumo como automatico: a aplicacao de estoque e uma acao operacional controlada.

### Comissao

Servicos podem ser elegiveis ou nao para comissao. Profissionais podem ter taxa configurada. As linhas de atendimento armazenam snapshot da elegibilidade, taxa e valor projetado, permitindo leitura de fechamento sem recalcular tudo a partir do cadastro atual.

### Cobranca

O PetFlow possui faturas e pagamentos no dominio pet/financeiro. A renovacao de plano pode gerar ou reutilizar fatura de renovacao via fluxo de mensagem preparada, mas isso nao significa que exista gateway de pagamento integrado.

### Mensageria e mensagens preparadas

Existem duas camadas distintas:

1. Fluxo manual assistido atual:
   - configuracao em `/pet/billing-message-settings`;
   - preparacao de mensagem de renovacao em `/pet/messages/plans/{planId}/renewal-reminder`;
   - preparacao de mensagem de retirada em `/pet/messages/appointments/{appointmentId}/pickup`;
   - frontend copia e exibe a mensagem para revisao/envio manual.

2. Fundacao tecnica para WhatsApp:
   - entidades e endpoints em `core.messaging`;
   - configuracao de canal WhatsApp;
   - registro de dispatch;
   - webhook de verificacao/recebimento;
   - provider para WhatsApp Cloud API.

O envio real oficial via WhatsApp nao faz parte do estado validado da sprint, porque ficou bloqueado por billing externo da Meta. A base tecnica existe, mas a demonstracao atual deve usar o fluxo manual assistido.

## Decisoes Arquiteturais Relevantes

- Modular monolith em vez de microservicos para acelerar TCC/demo sem perder separacao por dominio.
- Multi-tenancy e permissoes desde o inicio, evitando reescrita futura de seguranca.
- Flyway incremental, preservando historico e compatibilidade de bancos existentes.
- Estoque compartilhado em `core.inventory`, com PetFlow consumindo essa fundacao por meio de vinculos especificos.
- Mensageria em `core.messaging`, separada do dominio PetFlow, para permitir extensao futura sem acoplar WhatsApp ao atendimento.
- Mensagens preparadas mantidas em `modules.pet.billing`, porque a regra de texto depende de plano, cliente, pet, fatura e atendimento.
- Fluxo manual assistido documentado como etapa segura enquanto a integracao oficial nao esta liberada.

## Limites Atuais

- WhatsApp oficial nao esta validado em producao/demo por bloqueio de billing externo.
- Nao ha gateway PIX/cartao integrado; PIX aparece como dado textual para orientacao manual.
- Relatorios avancados ainda nao sao o foco principal.
- Portal do cliente nao e parte do escopo atual.
- O sistema preserva codigo clinico legado/adjacente no monorepo, mas a narrativa atual de produto e Banho e Tosa.

## Documentos Relacionados

- [Modelagem de dominio Banho e Tosa](../domain/petflow-grooming-domain.md)
- [Checklist de validacao manual](../validation/manual-validation-checklist.md)
- [Decision log](../tcc/decision-log.md)
- [Roadmap](../tcc/roadmap.md)
