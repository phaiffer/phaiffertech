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
| 2 | Hoje | Colunas "No banho" e "Na tosa" | Status separado para banho e tosa | Unificadas em "Em atendimento" (`IN_PROGRESS`) |
| 2 | Hoje | Coluna e métrica "Retirado" | Sinal de que o pet foi retirado | Omitidas |
| 2 | Hoje | Caixa: linha "Saídas" e caixa completo do dia | Movimentos de caixa do dia (entradas e saídas) por forma de pagamento | Mostra pagamentos confirmados hoje nas 200 faturas mais recentes; sem saídas |
| 2 | Hoje | "Avisar tutor" direto no cartão | Ação de envio na própria fila | O cartão leva para a Agenda, onde a mensagem de retirada já é preparada |
| 2 | Agenda | "Horário livre / encaixe" e carga do profissional ("6/7") | Jornada e capacidade de cada profissional | Omitidos; clicar numa hora vazia agenda naquele horário |
| 2 | PDV | **Registro da venda** | Fluxo de venda: fatura, pagamento e baixa de estoque a partir do PDV | **O checkout continua simulado, como já era antes do redesign**; a tela avisa que a venda não é registrada |
| 2 | PDV | "Coberto pelo plano", troco e "atendimentos prontos para cobrar" | Vínculo da venda com plano e atendimento; valor recebido em dinheiro | Omitidos |
| 3 | Clientes | Colunas "Pets", "Plano", "Última visita" e "Em aberto" | Agregados por cliente na listagem (quantidade de pets, plano ativo, último atendimento, saldo em aberto) | Omitidas; a tabela mostra cliente, telefone, e-mail e status. Os pets aparecem no painel de edição do cliente |
| 3 | Cadastro de cliente | Preferências de aviso (WhatsApp, SMS, e-mail) e "pode retirar o pet" | Campos de preferência de contato e de pessoas autorizadas a retirar | Omitidos; os contatos de apoio continuam em "Contatos de apoio" |
| 3 | Cadastro de cliente | Resumo financeiro do cliente (gasto total, em aberto) | Agregado financeiro por cliente | Omitido |
| 3 | Menu lateral | Busca `/` "Buscar pet ou tutor" | Busca unificada de pets e tutores | A busca procura só tutores: leva para `/pet/clients?search=termo` |

## Pendências de frontend (fases seguintes)

Itens que não dependem do backend, mas que a fase 1 não alcança por exigirem mudar a estrutura de cada tela:

- **Paginação "1-14 de 248"**: o componente já suporta (`pageSize`), mas cada tela precisa passar o tamanho da página.
- **Rótulos em caixa-alta com espaçamento** (cerca de 150 ocorrências) e **grades de cartões de KPI**: viram faixa de métricas (`dl`) tela a tela.
- **Gradientes de destaque** que usam `var(--accent)` (por exemplo, o cartão "Atendimentos do dia"): hoje resolvem para tinta; serão trocados pela faixa de métricas.
- **Variáveis antigas** `--pet-*` (24 usos) e `--accent*` (135 usos): na fase 1 elas apontam para os tokens v2; o uso direto sai à medida que cada tela é refeita.
- **Frases de efeito e textos de "demo"** nos catálogos de mensagens: revisados junto com cada tela.
- **Contatos de apoio / Contatos do CRM** (`modules/crm/contacts-page.tsx` e `contact-form-page.tsx`): a tela é compartilhada entre a Gestão Pet e o CRM e ainda tem textos fixos no código, sem acento e fora dos catálogos de i18n. Na fase 3 ganhou contagem no título, paginação com `pageSize` e perdeu os cartões de métrica na superfície pet; a migração completa dos textos fica para a fase 6, junto com o Comercial.

## Decisões registradas

- **Escopo do visual v2**: os tokens, a fonte IBM Plex e os componentes `.ui-*` valem dentro de `[data-surface='app']`, que o `AppShell` aplica à raiz e ao `<body>` enquanto está montado. O site público, o login e a recuperação de senha (fase 7) mantêm o visual atual até sua fase.
- **Paletas do Tailwind**: `slate`, `emerald`, `amber`, `red`, `rose`, `blue`, `sky`, `violet` e `white` leem variáveis CSS. Fora do app usam os valores originais da Tailwind; dentro do app viram neutros (tons 50-300) e as cores semânticas do v2 (tons 400+). No tema escuro a escala se inverte.
- **Fase 2, Hoje**: `/dashboard`, `/pet` e `/pet/dashboard` abrem a mesma tela "Hoje". A antiga tela `/pet` (cartões de "Workspace", código do ambiente) foi removida, assim como a aba duplicada "Workspace" da sub-navegação.
- **Fase 2, Agenda**: visões Dia (grade por profissional, padrão), Lista e Mês. "Semana" não depende de dado novo e fica como evolução de frontend.
- **Fase 2, PDV**: os quatro cartões de resumo mostravam números fixos no código (vendas, faturamento, ticket médio, itens) e foram removidos. Corrigido também um erro antigo: o PDV pedia 500 itens por página, acima do limite da API (200), e ficava sem produtos e clientes sem avisar.
- **Fase 3, Clientes e Pets**: os cartões de métrica contavam só os registros da página atual e foram removidos; o total vai no título. A seleção em lote usa apenas ações que já existem (exportar CSV no navegador). Datas passam a seguir o idioma ativo.
- **Fase 3, Perfil do pet**: a tela `/pet/pets/[id]/timeline` é o perfil do pet e exige só `pet.profile.read` (antes exigia permissões clínicas e bloqueava a equipe de banho e tosa). Mostra dados do pet, cuidados, atendimentos e tutor; o histórico clínico e as vacinas aparecem apenas para quem tem as permissões clínicas.
- **Status como ponto**: `StatusBadge` agrupa os status em aguardando (cinza: agendado, confirmado, pendente), em atendimento (azul), concluído (verde), atenção (`warn`) e erro/cancelado (`danger`). A separação "No banho" / "Na tosa" e o estágio "Retirado" da fila serão tratados na fase 2, conforme a regra de estágios do prompt.
