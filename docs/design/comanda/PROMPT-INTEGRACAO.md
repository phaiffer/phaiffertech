# Prompt — integrar o redesign "Comanda v2" no frontend

> Cole este arquivo inteiro como primeira mensagem de uma sessão de código (Claude Code ou similar) aberta no repositório `phaiffer/phaiffertech`.

---

## Contexto

Você vai aplicar um redesign visual no frontend Next.js deste monorepo (`apps/frontend`). O produto é um SaaS de gestão para **banho e tosa** (agenda, fila do dia, clientes e pets, planos recorrentes, PDV, estoque, cobrança, comissão, clínica, comercial). Hoje o visual é o padrão shadcn (verde esmeralda `#10B981` + cinza ardósia, cards arredondados com sombra). Ele deve passar a seguir a direção **Comanda v2**: uma ferramenta de balcão sóbria, densa e legível, sem cara de "template de IA".

O trabalho é **só de frontend e apresentação**. Não altere backend, contratos de API, regras de permissão/entitlement, nem o comportamento dos fluxos.

## Fonte da verdade do design

Os protótipos estão em `docs/design/comanda/` (arquivos `.dc.html`: HTML estático + um bloco `<script>` com os dados de exemplo em `renderVals()`). Abra-os como referência de layout, hierarquia e copy. **Não** copie o markup literalmente: reimplemente com React + Tailwind e os componentes do projeto.

- **Direção visual (vale para tudo):** `docs/design/comanda/v2/Hoje.dc.html`, `v2/Clientes.dc.html`, `v2/PDV.dc.html`.
- **Conteúdo e estrutura de cada tela:** os demais arquivos em `docs/design/comanda/*.dc.html` (versão v1). Eles mostram o que cada tela contém. Ao implementar, **troque o visual v1 pelo v2** (veja "Tradução v1 → v2").
- `docs/design/comanda/canvas.json` lista todas as telas com título.

## Sistema visual v2 (tokens exatos)

Implemente como CSS variables em `apps/frontend/src/app/globals.css` e exponha no `apps/frontend/tailwind.config.ts`. Substitua as variáveis atuais (`--pet-primary`, `--accent-*`, `--icon-*` etc.) por estas. Mantenha os nomes de compatibilidade shadcn (`--primary`, `--card`, `--border`, `--ring`…) apontando para os novos valores, para não quebrar componentes existentes.

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#1C1C1A` | texto principal, botão primário, bordas de ênfase |
| `--ink-2` | `#3A3A36` | texto de corpo secundário |
| `--muted` | `#5F5F5A` | rótulos, metadados (contraste ≥ 4.5:1 sobre branco) |
| `--faint` | `#8A8A84` | só para itens desabilitados ou riscados |
| `--bg` | `#FFFFFF` | fundo das páginas |
| `--bg-subtle` | `#F7F7F5` | menu lateral |
| `--bg-row` | `#FBFBFA` | cabeçalho de tabela, painel lateral do PDV |
| `--selected` | `#F4F4F1` / `#EAEAE5` | linha selecionada / item ativo do menu |
| `--line` | `#E6E6E1` | divisórias estruturais |
| `--line-soft` | `#EFEFEA` | divisória entre linhas |
| `--control` | `#D6D6D0` | borda de input e botão secundário |
| `--highlight` | `#FFE066` | marca-texto **somente** no nome do pet em estado "Pronto" |
| `--danger` | `#B3261E` | valores em aberto, cancelar |
| `--warn` | `#9A4A00` | estoque baixo, plano terminando |
| status: aguardando / em atendimento / tosa / pronto / retirado | `#8A8A84` / `#2F6FD6` / `#7350D9` / `#C79A00` / `#23894F` | **apenas** em pontinhos de 7px ao lado do texto |

- **Tipografia:** IBM Plex Sans (400/500/600) para tudo e IBM Plex Mono (400/500) para horários, valores, códigos, contagens e telefones. Carregue com `next/font/google` em `src/app/layout.tsx` e troque `--font-geist-*` no `tailwind.config.ts`. Corpo 14px; título de página 20px/600; título de seção 14px/600; metadado 12–13px.
- **Forma:** raio 6px (inputs, botões, cards); sem `box-shadow`; bordas de 1px. Altura de controle 36px (primário de ação crítica 44–52px). Linha de tabela 40px.
- **Números:** sempre em mono, alinhados à direita nas tabelas, formato pt-BR (`R$ 1.247,50`). Use os formatters de `src/shared/i18n/formatters.ts`.

### Proibido no v2 (é o que dava "cara de IA")

- etiquetas/pílulas com fundo pastel (lilás, pêssego, menta, azul-bebê);
- legenda em caixa-alta mono com espaçamento acima dos títulos;
- avatares de letra inicial em quadrados coloridos;
- cards com raio ≥ 12px, sombras, gradientes, borda colorida só na esquerda;
- fontes display decorativas e títulos gigantes;
- frases de efeito ("Como o negócio está indo", "Do balcão à retirada…"): use títulos operacionais e diretos;
- emoji como ícone (use `lucide-react`, já instalado, traço de 1.75–2px, 14–18px).

## Tradução v1 → v2 (aplique a cada tela)

| Nos arquivos v1 | Implemente como |
|---|---|
| Barra lateral escura só de ícones | Menu lateral claro (`--bg-subtle`) com rótulos, agrupado em **Operação / Cadastros / Gestão**, contadores em mono, seletor de loja/unidade no topo e busca `/` |
| Card grande com KPI colorido | Faixa de métricas em linha com divisórias (`dl` com `dt`/`dd`) |
| Card por item em grid | Tabela densa ou lista com divisórias, exceto na fila do dia (colunas por estágio com cartões planos de borda 1px) |
| Pílula colorida de status | Pontinho de status + texto, ou texto simples |
| Botões grandes amarelos | Primário em tinta (`--ink`), secundário com contorno; amarelo só como marca-texto de "Pronto" |
| Cabeçalho com eyebrow + H1 40px + frase | H1 20px + contagem em mono + ações à direita; sub-navegação como abas simples |

Detalhes que precisam existir: atalhos de teclado onde o design mostra (`N` novo atendimento, `/` busca, PDV: `F2` busca, `Enter` adiciona, `F4` desconto, `F5–F8` pagamento, `F9` finalizar); "atualizado HH:MM"; filtros como botões com borda tracejada mostrando o valor atual; seleção em lote com barra de ações; paginação "1–14 de 248"; truncamento com reticências em textos longos; estados vazio/carregando/erro (reaproveite as mensagens que já existem em `src/shared/i18n/messages/*.ts`).

## Mapa de telas → rotas

Rotas em `apps/frontend/src/app/(app)/...`, componentes em `apps/frontend/src/modules/...`.

| Design | Rota | Componente atual |
|---|---|---|
| `v2/Hoje`, `Hoje` | `/pet`, `/pet/dashboard`, `/dashboard` | `modules/pet/pet-operations-dashboard.tsx`, `pet-home.tsx`, `dashboard-page.tsx` |
| `Agenda` | `/pet/appointments` | `pet-appointments-page.tsx`, `pet-appointments-calendar.tsx`, `pet-appointments-sections.tsx` |
| `v2/PDV`, `PDV` | `/pet/pos` | `pos-page.tsx` |
| `v2/Clientes`, `Clientes` | `/pet/clients` | `clients-page.tsx` |
| `ClienteForm` | `/pet/clients/new` (+ edição) | `clients-page.tsx` (formulário) |
| `Contatos` | `/pet/clients/contacts`, `/new`, `/[id]` | `client-support-contacts-page.tsx`, `client-support-contact-form-page.tsx` |
| `Pets` | `/pet/pets` | `pet-profiles-page.tsx` |
| `CadastroPet` | `/pet/pets/new` | `pet-profiles-page.tsx` (formulário) |
| `PetPerfil` | `/pet/pets/[id]/timeline` | `pet-timeline-page.tsx` |
| `Servicos` | `/pet/services` | `pet-services-page.tsx` |
| `Planos` | `/pet/plans` | `pet-plans-page.tsx` |
| `FollowUp` | `/pet/follow-up` | `pet-follow-up-page.tsx` |
| `Equipe` | `/pet/professionals` | `pet-professionals-page.tsx` |
| `Fechamento` | `/pet/commissions` | `pet-commission-summary-page.tsx` |
| `Estoque` | `/pet/inventory`, `/pet/products`, `/inventory` | `pet-inventory-page.tsx`, `pet-products-page.tsx`, `modules/inventory/inventory-hub-page.tsx` |
| `Financeiro` | `/pet/finance` | `modules/pet/finance-dashboard.tsx` |
| `Caixa` | `/finance/cash` | `modules/finance/finance-cash-page.tsx` |
| `Cobranca` | `/pet/invoices`, `/finance/invoices`, `/finance/payments` | `pet-invoices-page.tsx`, `finance-invoices-page.tsx`, `finance-payments-page.tsx` |
| `Clinica` | `/pet/clinic` | `clinic-dashboard.tsx` |
| `Prontuario` | `/pet/medical-records` | `pet-medical-records-page.tsx`, `pet-medical-sections.tsx` |
| `TimelineClinica` | `/pet/clinic/timeline` | `clinic-timeline-page.tsx` |
| `Comercial` | `/pet/commercial` | `pet-commercial-page.tsx`, `pet-commercial-pipeline-page.tsx`, `pet-commercial-deals-page.tsx` |
| `Lead` | `/pet/commercial/leads/new`, `/[id]` | `pet-commercial-lead-form-page.tsx`, `pet-commercial-leads-page.tsx` |
| `Insights` | `/pet/insights` | `pet-insights-page.tsx` |
| `Login`, `Senha` | `/login`, `/forgot-password`, `/reset-password` | rotas em `app/(public)/…` |
| `Configuracoes` | `/settings` | página em `app/(app)/settings` |
| `Usuarios` | `/users` | página em `app/(app)/users` |
| `Ambientes` | `/tenants` | página em `app/(app)/tenants` |
| `Ficha` (celular) | — | referência para a versão responsiva da fila e do detalhe do atendimento |

O site público (`/`, `/about`, `/products`, `/platform`, `/contact`, `/articles`, `/research`, `/engineering`) **fica fora** deste trabalho.

## Regras de dados (importante)

Os protótipos usam dados de exemplo e alguns conceitos que **o backend ainda não tem**. Nunca invente dados nem crie endpoints. Faça assim:

1. **Estágios da fila.** Os status reais de atendimento são `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`, `NO_SHOW`. Mapeie: Aguardando = `SCHEDULED`/`CONFIRMED`; Em atendimento = `IN_PROGRESS` (o design separa "No banho" e "Na tosa", mas **una as duas** em "Em atendimento" enquanto não houver dado); Pronto = `COMPLETED`, com o indicador de mensagem de retirada que já existe. "Retirado" não existe: omita a coluna, ou mostre-a só se houver um sinal real (por exemplo, fatura paga). Registre a decisão.
2. Use só campos que a API já devolve (veja `src/shared/types/*.ts` e `src/shared/services/*`). Se o design mostrar algo sem dado (porte P/M/G/GG com tempo de agenda, alertas de comportamento, "pode retirar o pet", atalhos de cobrança por WhatsApp, troco no PDV, escala semanal da equipe, gráficos de insights que o backend não calcula), **não implemente o dado**: deixe o espaço fora da tela ou atrás de condição, e anote em `docs/design/comanda/GAPS.md` (tela, elemento, dado necessário).
3. Mantenha todos os `PermissionGate`/`ModuleGuard`, verificações de entitlement e a navegação condicional de `src/shared/platform/sidebar-navigation.ts`. O menu novo deve continuar escondendo o que o usuário/tenant não pode ver.
4. Todo texto novo entra em `src/shared/i18n/messages/pt-br.ts` **e** `en-us.ts`. Não escreva texto fixo em componentes. Aproveite para corrigir acentuação que falta nas mensagens pt-BR das telas que você tocar ("Cobranca" → "Cobrança", "Catalogo" → "Catálogo", "proximo" → "próximo", etc.).
5. Acessibilidade: elementos clicáveis são `<button>`/`<a>` reais, inputs com `<label>`, botões só de ícone com `aria-label`, contraste ≥ 4.5:1, foco visível (anel de 2px `--ink` com offset de 2px), área de toque ≥ 36px no desktop e ≥ 44px no mobile. Cor nunca é o único sinal: status sempre tem texto.
6. Responsivo: o menu lateral vira gaveta abaixo de 900px; tabelas largas rolam dentro de uma caixa; a fila do dia vira lista agrupada por estágio no celular (veja `Ficha.dc.html`).

## Ordem de execução (um PR por fase)

1. **Fundação.** Tokens no `globals.css` e no `tailwind.config.ts`, fontes IBM Plex via `next/font`, tema escuro equivalente (inverta ink/bg mantendo os mesmos contrastes; continue com `[data-theme='dark']`). Restilize os primitivos em `src/shared/ui/` e `src/shared/ui/shadcn/` (button, input, badge → "status com ponto", card → painel plano, table/data-table densa, pagination, search-input, page-title sem eyebrow). Refaça `src/shared/components/sidebar.tsx` e `app-shell.tsx` no layout v2, mantendo a lógica de `sidebar-navigation.ts`. Ao fim da fase, todas as telas já herdam o visual novo sem mudar de estrutura.
2. **Operação:** Hoje, Agenda, PDV (com atalhos de teclado).
3. **Cadastros:** Clientes, cadastro de cliente, Contatos, Pets, cadastro de pet, Perfil do pet.
4. **Operação de serviço:** Serviços, Planos, Follow-up, Equipe, Fechamento.
5. **Dinheiro e estoque:** Estoque/Produtos, Financeiro, Caixa, Cobrança.
6. **Clínica, Comercial e Insights.**
7. **Conta e admin:** Login, Esqueci/Redefinir senha, Configurações, Usuários, Ambientes (o banner de modo plataforma e o `impersonation-banner.tsx` continuam funcionando).

Em cada fase:
- Rode `npm run lint`, `npm test` (Vitest) e `npm run build` dentro de `apps/frontend`. Atualize testes que dependem de classes, textos ou estrutura alterados, sem enfraquecer o que eles verificam. Não pule nem desative testes.
- Antes de abrir o PR, confira cada tela no navegador (desktop 1440px e celular 390px), nos temas claro e escuro.
- Descreva no PR o que foi feito, o que ficou em `GAPS.md` e as capturas antes/depois.

## Fora do escopo

- Backend (`apps/backend`), migrations, contratos de API.
- Novas funcionalidades que dependam de dado inexistente (vão para `GAPS.md`).
- Nome do produto: continue usando o nome atual do tenant/workspace; onde o design mostra `[NOME]`, use o valor que o app já exibe.
- Site público.

## Critério de pronto

- Nenhum resquício da paleta esmeralda/ardósia nem das variáveis `--pet-*`/`--icon-*` em uso.
- Todas as rotas da tabela acima seguem o sistema v2, nos temas claro e escuro, no desktop e no celular.
- Lint, testes e build verdes.
- `docs/design/comanda/GAPS.md` lista tudo o que o design pede e o backend ainda não fornece.
