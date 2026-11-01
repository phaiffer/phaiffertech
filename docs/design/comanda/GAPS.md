# Comanda v2: lacunas entre o design e os dados

Este arquivo lista o que os protótipos de `docs/design/comanda/` pedem e o backend ainda não fornece, conforme a regra de dados do [prompt de integração](PROMPT-INTEGRACAO.md): nenhum dado é inventado e nenhum endpoint é criado durante o redesign. Cada fase acrescenta suas linhas.

## Lacunas de dados (backend)

| Fase | Tela | Elemento do design | Dado necessário | Situação no frontend |
| --- | --- | --- | --- | --- |
| 1 | Menu lateral | Contadores ao lado de cada item ("Hoje 14", "Clientes 248", "Estoque 3") | Contagens leves por área, por exemplo um resumo em `/api/v1/modules` ou um endpoint de contagens | Omitido |
| 1 | Menu lateral | Seletor de loja/unidade no topo ("Unidade Centro") | Conceito de unidade/filial dentro do tenant; hoje um login corresponde a um único tenant | Mostra o nome do ambiente, sem seletor |
| 1 | Menu lateral | Busca `/` "Buscar pet ou tutor" | Busca unificada de pets e tutores | Omitida nesta fase; a fase 3 liga a busca à tela de Clientes |
| 1 | Menu lateral | Função do usuário ("Marina · recepção") | Rótulo amigável da função no tenant (hoje há apenas o papel técnico) | Mostra só o nome do usuário |
| 1 | Shell | Sino de notificações | Fonte de notificações | O sino não tinha dados ("nenhuma notificação"); foi removido |

## Pendências de frontend (fases seguintes)

Itens que não dependem do backend, mas que a fase 1 não alcança por exigirem mudar a estrutura de cada tela:

- **Paginação "1-14 de 248"**: o componente já suporta (`pageSize`), mas cada tela precisa passar o tamanho da página.
- **Rótulos em caixa-alta com espaçamento** (cerca de 150 ocorrências) e **grades de cartões de KPI**: viram faixa de métricas (`dl`) tela a tela.
- **Gradientes de destaque** que usam `var(--accent)` (por exemplo, o cartão "Atendimentos do dia"): hoje resolvem para tinta; serão trocados pela faixa de métricas.
- **Variáveis antigas** `--pet-*` (24 usos) e `--accent*` (135 usos): na fase 1 elas apontam para os tokens v2; o uso direto sai à medida que cada tela é refeita.
- **Frases de efeito e textos de "demo"** nos catálogos de mensagens: revisados junto com cada tela.

## Decisões registradas

- **Escopo do visual v2**: os tokens, a fonte IBM Plex e os componentes `.ui-*` valem dentro de `[data-surface='app']`, que o `AppShell` aplica à raiz e ao `<body>` enquanto está montado. O site público, o login e a recuperação de senha (fase 7) mantêm o visual atual até sua fase.
- **Paletas do Tailwind**: `slate`, `emerald`, `amber`, `red`, `rose`, `blue`, `sky`, `violet` e `white` leem variáveis CSS. Fora do app usam os valores originais da Tailwind; dentro do app viram neutros (tons 50-300) e as cores semânticas do v2 (tons 400+). No tema escuro a escala se inverte.
- **Status como ponto**: `StatusBadge` agrupa os status em aguardando (cinza: agendado, confirmado, pendente), em atendimento (azul), concluído (verde), atenção (`warn`) e erro/cancelado (`danger`). A separação "No banho" / "Na tosa" e o estágio "Retirado" da fila serão tratados na fase 2, conforme a regra de estágios do prompt.
