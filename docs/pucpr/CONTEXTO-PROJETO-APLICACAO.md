# Contexto do Projeto de Aplicação (PUCPR)

A Plataforma de Gestão para Negócios Pet (este monorepo) é a base do Projeto de Aplicação, disciplina certificadora da pós-graduação em Arquitetura de Software da PUCPR Digital. Os fatos levantados no código estão em [levantamento-estado-atual.md](levantamento-estado-atual.md).

Material original, fora do repositório: `D:\Cardoso desenvolvimento de sistemas\Pos-Graduacao\PUC-PR\Projeto de Aplicação`.

## 1. A disciplina

- Começa em 01/02/2027 e dura 6 semanas: S1 vídeo do professor; S2 entrega parcial opcional para feedback, sem nota, que será usada; S3 retorno do professor; S4 live; S5 concepção; S6 entrega final avaliada.
- Proposta: projeto de intervenção, com soluções arquiteturais para uma situação-problema em um produto de software. A solução não precisa estar implementada; é uma proposta fundamentada, com plano de ação e riscos.
- Entrega: arquivo Word de 6 a 10 páginas, contando as referências, no Modelo de Entrega da PUCPR, disponível quando a disciplina abrir. Pode ser em português ou inglês.

| Seção obrigatória | Limite |
| --- | --- |
| Título | 1 linha |
| Sumário executivo: ambiente, usuários, finalidade, funções | até 1 página |
| Problematização: arquitetura atual, nuvem, dados, segurança | até 1 página |
| Justificativa | até ½ página |
| Objetivo geral | até 5 linhas |
| Fundamentação teórica | até 2 páginas |
| Percurso metodológico: solução, riscos e mitigação | até 3 páginas |
| Resultados esperados | até ½ página |
| Referências | sem limite próprio |

O Guia pede que a solução aborde: escalabilidade horizontal e alta disponibilidade; extensibilidade; separação de responsabilidades; camadas independentes e API RESTful; nuvem e infraestrutura como código; backup e recuperação; PaaS; segurança em todas as camadas, com rastreabilidade, privilégio mínimo e controle de acesso.

Critérios de avaliação: estruturação; aderência ao tema do curso; delimitação da situação-problema; qualidade e fundamentação da intervenção; percurso metodológico; clareza e norma culta.

## 2. Foco escolhido

Automatizar a cobrança e a comunicação da plataforma, com foco em Banho e Tosa, por meio de uma arquitetura orientada a eventos.

**Situação-problema:** a recepção cobra, confirma pagamento e lembra a renovação de plano manualmente. O PIX aparece como texto, não há gateway, o WhatsApp oficial está bloqueado pelo billing da Meta e as mensagens são preparadas e copiadas à mão. As consequências são inadimplência, planos que vencem sem renovação, retrabalho e fechamento operacional pouco confiável.

**Intervenção proposta:** providers de pagamento (PIX dinâmico) e de mensageria (WhatsApp) atrás de interfaces; ciclo fatura, método, tentativa e evento em `core.finance`; transactional outbox e fila, por exemplo GCP Pub/Sub; webhooks idempotentes; retry com backoff e dead-letter; conciliação automática.

**Aspectos transversais:** Cloud Run com escala horizontal; Cloud SQL com HA, backup e PITR; Secret Manager e IAM de privilégio mínimo; isolamento por tenant; auditoria; LGPD; nenhum dado de cartão armazenado.

**Riscos a tratar:** dependência de terceiros (PSP, Meta), cobrança duplicada, vazamento entre tenants, consistência eventual, custo e falha de webhook.

## 3. Fontes no repositório

- `README.md`: stack, monólito modular, multi-tenancy, RBAC, endpoints, observabilidade e Terraform.
- `docs/tcc/decision-log.md`, `docs/tcc/roadmap.md`, `docs/tcc/payment-architecture-notes.md`.
- `docs/payments/*` e `docs/platform/gcp-minimal-infra.pt-BR.md`.
- `infra/gcp/terraform` e o código em `apps/backend` (`core.finance`, `core.messaging`, `modules.pet`).

## 4. Regras de trabalho

1. **Honestidade técnica:** nada é afirmado como implementado sem confirmação no código. "Estado atual" e "proposta" ficam sempre separados.
2. **Sem invenção:** dado ausente vira `[PREENCHER: ...]` ou `[VERIFICAR: ...]` e é perguntado ao autor.
3. **Uso de IA (Resolução CONSUN 274/2024):** o autor revisa tudo, a IA não é coautora, o uso é declarado com a declaração padrão da PUCPR, e as referências são reais e verificáveis.
4. **Material de `docs/tcc`:** o autor confirmou em 2026-11-05 que ele é exclusivo desta pós e não foi entregue em outro local, então não há risco de autoplágio.
5. **Redação:** pt-BR, norma culta, tom acadêmico-profissional.
6. **Nome do produto:** "PetFlow" não é o nome do produto e não aparece no Projeto de Aplicação. O produto ainda não tem marca comercial. No texto, usar "Plataforma de Gestão para Negócios Pet" ou "a plataforma"; "Gestão Pet" é só um rótulo provisório da interface. Nomes técnicos como `modules.pet` e `core.finance` podem ser citados.

## 5. Correções ao contexto original

O levantamento mostrou que parte do que estava descrito como proposta já existe. A problematização deve partir do quadro abaixo:

- A porta `PaymentProvider` já existe; o que falta é um adapter externo e o método de cobrança ser usado pelo fluxo.
- O provider do WhatsApp, o envio e o webhook já existem no código; o bloqueio é externo e o envio não é assíncrono nem automático.
- Backup e PITR já estão no Terraform; falta HA, pois a instância é `ZONAL`.
- O evento de pagamento já existe; método e tentativa continuam como proposta.
