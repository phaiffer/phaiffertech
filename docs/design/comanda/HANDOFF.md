# Comanda v2: handoff para continuar o redesign

Este arquivo existe para que qualquer agente (Codex CLI, Claude Code ou outro) continue o redesign do frontend sem perder contexto. Leia nesta ordem:

1. este arquivo (estado, convenções e armadilhas já conhecidas);
2. [PROMPT-INTEGRACAO.md](PROMPT-INTEGRACAO.md) (especificação do design: tokens, regras, mapa de telas, ordem das fases);
3. [GAPS.md](GAPS.md) (o que o design pede e o backend não fornece, e as decisões já tomadas).

Os protótipos de referência estão nesta pasta (`*.dc.html`; a direção visual vale pelos arquivos de `v2/`).

## Estado das fases (atualize ao terminar cada uma)

| Fase | Escopo | Estado | PR |
| --- | --- | --- | --- |
| 1 | Fundação: tokens, fontes, primitivos, menu lateral e app shell | Concluída | #100 |
| 2 | Operação: Hoje, Agenda, PDV (com atalhos) | Concluída | #101 |
| 3 | Cadastros: Clientes, cadastro de cliente, Contatos, Pets, cadastro de pet, Perfil do pet | Concluída | #103 |
| 4 | Operação de serviço: Serviços, Planos, Follow-up, Equipe, Fechamento | **Próxima** | |
| 5 | Dinheiro e estoque: Estoque/Produtos, Financeiro, Caixa, Cobrança | Pendente | |
| 6 | Clínica, Comercial e Insights | Pendente | |
| 7 | Conta e admin: Login, Esqueci/Redefinir senha, Configurações, Usuários, Ambientes | Pendente | |

Depois da fase 7, o próximo trabalho combinado com o dono do projeto é o **Projeto de Aplicação da pós PUCPR** (ver "Depois do redesign", no fim).

## Como trabalhar (combinado com o dono do projeto)

- Comunicação com o usuário em **português (pt-BR)**.
- **Uma branch e uma PR por fase**, a partir da `main` atualizada: `feat/redesign-fase-N`.
- PR sempre atribuída ao dono: `gh pr create --assignee @me`.
- **Nunca** adicionar `Co-Authored-By`, "Generated with" ou qualquer assinatura de IA em commits ou PRs.
- O dono faz o merge e avisa ("merge feito"). Depois disso: `git switch main && git pull --ff-only`, apagar a branch local e começar a próxima fase.
- Não fazer force-push. Se a `main` andar e a PR entrar em conflito, resolver com merge da `main` na branch.
- Antes de abrir a PR, em `apps/frontend`: `npx tsc --noEmit -p .`, `npm run lint`, `npm test` (Vitest) e, quando possível, `npm run build` (o build roda no CI de qualquer forma).
- Conferir cada tela no navegador: desktop (1440px) e celular (390px), temas claro e escuro. Login local de demo: tenant `phaiffertech-demo`, `demo@phaiffertech.local` / `Demo@123`.
- Atualizar `GAPS.md` com as lacunas de dados da fase e as decisões tomadas.
- Na descrição da PR: o que mudou, o que foi para o GAPS, como foi testado e qualquer bug encontrado no caminho.

## O que já existe (use, não recrie)

### Escopo do visual v2
- O visual v2 vale dentro de `[data-surface='app']`. O `AppShell` (`src/shared/components/app-shell.tsx`) aplica o atributo na raiz e no `<body>` enquanto está montado.
- **Site público, login e recuperação de senha ficam fora** até a fase 7. Na fase 7, envolva as páginas de login/senha num elemento com `data-surface="app"`, porque elas não passam pelo `AppShell`.
- Arquivos do site público que não devem ser alterados: `src/modules/website/*`, `src/app/(public)/*` (exceto login e senha na fase 7), `src/shared/components/public-*`, `src/shared/components/brand-assets.tsx`.

### Tokens e paleta (`src/app/globals.css`, `tailwind.config.ts`)
- Tokens do prompt como variáveis CSS (`--ink`, `--ink-2`, `--muted`, `--faint`, `--bg`, `--bg-subtle`, `--bg-row`, `--selected`, `--selected-strong`, `--line`, `--line-soft`, `--control`, `--highlight`, `--danger`, `--warn`, `--status-*`) e tema escuro equivalente.
- As paletas `slate`, `emerald`, `amber`, `red`, `rose`, `blue`, `sky`, `violet` e `white` do Tailwind leem variáveis `--tw-*`: fora do app usam os valores originais da Tailwind; dentro do app viram neutros (tons 50 a 300) e cores semânticas do v2 (tons 400 em diante). Por isso telas antigas já parecem v2 sem edição; ao refazer uma tela, prefira os tokens diretos (`text-[var(--ink)]`, `border-[color:var(--line)]`).
- Classes utilitárias v2: `.ui-status-dot[data-status=waiting|in-progress|grooming|ready|done|warn|danger]`, `.ui-highlight` (só no nome do pet "Pronto"), `.ui-kbd`, `.ui-filter-chip[data-active]` (filtro com borda tracejada), `.ui-mono`, `.ui-field-shell` (anel de foco num contêiner com input interno), `.ui-critical-button` (ação crítica de 44px ou mais), além de `.ui-primary-button`, `.ui-secondary-button`, `.ui-input-control`, `.ui-notice-*`, `.ui-dialog-*`.
- Breakpoint `nav` (900px): abaixo dele o menu lateral vira gaveta.

### Componentes
- `PageTitle` (`src/shared/ui/page-title.tsx`): H1 de 20px, prop `count` em mono, ações à direita, sem eyebrow.
- `DataTable` (`src/shared/ui/data-table.tsx`): tabela densa (linhas de 40px); use `className: 'text-right ui-mono'` nas colunas numéricas.
- `Pagination` (`src/shared/ui/pagination.tsx`): passe `pageSize` para mostrar "1-14 de 248".
- `StatusBadge` (`src/shared/dashboard/status-badge.tsx`): ponto de 7px + texto.
- `PetModuleSubnav`: abas simples.
- `useKeyboardShortcut(key, handler, { allowInInputs, enabled })` (`src/shared/hooks/use-keyboard-shortcut.ts`). Botões com atalho usam `aria-keyshortcuts="N"` e `<kbd className="ui-kbd" aria-hidden="true">`, senão o `<kbd>` entra no nome acessível.
- Referências de telas prontas: `src/modules/pet/pet-operations-dashboard.tsx` (Hoje), `pet-appointments-day-grid.tsx` (grade do dia), `pos-page.tsx` (PDV).

### Textos (i18n)
- Todo texto novo vai em `src/shared/i18n/messages/screens-pt-br.ts` **e** `screens-en-us.ts` (seção por tela, por exemplo `screens.petToday`), ou nos catálogos principais `pt-br.ts`/`en-us.ts` quando a seção já existir lá. O en-US é tipado a partir do pt-BR: chave faltando quebra o `tsc`.
- Interpolação com `{nome}` e `.replace('{nome}', valor)`; datas e números via `src/shared/i18n/formatters.ts`; erros da API via `resolveApiErrorMessage` (`src/shared/lib/api-error-message.ts`).
- Testes rodam em en-US.

## Armadilhas já encontradas

- **Limite de página da API: 200** (`PageRequestDto` com `@Max(200)`). Pedir mais retorna 400. O PDV pedia 500 e ficava vazio sem avisar (corrigido na fase 2).
- Componentes que usam `useRouter` precisam do mock `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))` nos testes.
- Não procure botões por classe CSS nos testes; use `getByRole(..., { name })`.
- `tsc` e testes não pegam tudo que quebra o `next build` (exemplo real: `import` antes de `'use client'`). Rode o build ou confira o CI.
- Após apagar arquivos, o `next dev` pode manter o módulo antigo em cache: reinicie o servidor de dev.
- Dados de exemplo do seed do backend têm palavras sem acento ("Pastor Alemao", "Shampoo hipoalergenico"); é dado, não texto de tela.
- O PDV **não registra vendas** (checkout simulado desde antes do redesign; a tela avisa). Não "consertar" dentro do redesign sem combinar com o dono: é funcionalidade nova.

## Próximo passo concreto: fase 4 (Operação de serviço)

Referências: `Servicos.dc.html`, `Planos.dc.html`, `FollowUp.dc.html`, `Equipe.dc.html`, `Fechamento.dc.html` (siga a direção visual de `v2/Clientes.dc.html`). Componentes: `src/modules/pet/pet-services-page.tsx`, `pet-plans-page.tsx`, `pet-follow-up-page.tsx`, `pet-professionals-page.tsx`, `pet-commission-summary-page.tsx`.

- Mesmo padrão da fase 3 (ver `clients-page.tsx` e `pet-profiles-page.tsx`): contagem no título (`PageTitle count`), `DataTable` densa, filtros como `.ui-filter-chip`, `Pagination` com `pageSize`, formulários em `FormSection` com `<label>`, datas com `formatDateForLocale`.
- Remover cartões de métrica que contam só a página atual ou mostram números fixos; registrar no GAPS o que o design pede e a API não dá.
- Textos novos nos catálogos `screens-pt-br.ts` / `screens-en-us.ts`; testes rodam em en-US.

## Depois do redesign: Projeto de Aplicação (PUCPR)

O dono do projeto pediu que, ao terminar as 7 fases, o trabalho siga para o Projeto de Aplicação da pós-graduação. Requisitos, prompts e documentos de parâmetro estão fora do repositório, em `D:\Cardoso desenvolvimento de sistemas\Pos-Graduacao\PUC-PR\Projeto de Aplicação`. Regras já combinadas: separar "estado atual" (com evidência no código) de "proposta"; nunca inventar métricas ou referências (usar `[PREENCHER]`/`[VERIFICAR]`); não usar o nome "PetFlow"; não copiar texto de `docs/tcc/*`; IA não é coautora.
