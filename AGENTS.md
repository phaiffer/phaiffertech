# Instruções para agentes de código

Monorepo da plataforma Gestão Pet (backend Java/Spring Boot em `apps/backend`, frontend Next.js em `apps/frontend`). Visão geral em [README.md](README.md) e arquitetura em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Redesign "Comanda v2" do frontend

As 7 fases foram concluídas e mergeadas (PRs #100 a #107). O histórico está em [docs/design/comanda/HANDOFF.md](docs/design/comanda/HANDOFF.md), a especificação em [docs/design/comanda/PROMPT-INTEGRACAO.md](docs/design/comanda/PROMPT-INTEGRACAO.md) e as lacunas de dados em [docs/design/comanda/GAPS.md](docs/design/comanda/GAPS.md).

Ao mexer em telas do frontend, consulte esses documentos e registre novas lacunas no `GAPS.md`.

## Regras do dono do projeto

- Responda em português (pt-BR).
- Commits e PRs **sem** `Co-Authored-By` e sem assinatura de IA ("Generated with ...").
- Toda PR com `gh pr create --assignee @me`.
- Uma branch por entrega, a partir da `main` atualizada; sem force-push.
- Não invente dados nem crie endpoints para preencher telas; registre a lacuna no `GAPS.md`.
- Todo texto de interface vai nos catálogos de i18n em pt-BR e en-US (`apps/frontend/src/shared/i18n/messages/`).
- Verificações do frontend (em `apps/frontend`): `npx tsc --noEmit -p .`, `npm run lint`, `npm test` e `npm run build`.
