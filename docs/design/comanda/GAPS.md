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
| 4 | Serviços | Matriz de preço e duração por porte P/M/G/GG | Preço e duração por porte no catálogo e no contrato de atendimento; hoje há apenas `basePrice` e `durationMinutes` | Mantidos preço e duração base, sem valores por porte |
| 5 | Financeiro | Indicadores do mês, gráfico de entradas e saídas por semana e "De onde vem a receita" | Filtro por período em caixa e pagamentos, ou agregados prontos por mês e por origem; hoje as listas não aceitam data | Omitidos; a tela mostra totais do servidor (contagens) e os registros mais recentes |
| 5 | Caixa | "Suprimento", "Sangria", "Lançar despesa" e "Fechar caixa" | Criação de movimento de caixa avulso e fechamento de caixa; a API só lê movimentos, que nascem dos pagamentos | Omitidos |
| 5 | Caixa | Colunas "Forma" e "Quem", e o resumo "Caixa de hoje" | Forma de pagamento e autor no movimento de caixa; filtro por data | Omitidos; a tabela mostra data, direção, categoria, descrição, valor e fatura |
| 5 | Cobrança | Faixas por situação com valor e quantidade ("em atraso", "a vencer") | Agregados de saldo por situação; hoje somar exigiria percorrer todas as faturas | Omitidas; os totais por página foram removidos e o atraso aparece na linha |
| 5 | Cobrança | "Enviar link Pix pelo WhatsApp" e "Baixar PDF" | Link de pagamento por fatura e geração do documento em PDF | Omitidos |
| 5 | Estoque | "Entrada de nota" e "Gerar pedido de compra" | Fluxos de entrada por nota fiscal e de pedido a fornecedor | Omitidos; a entrada é registrada como movimento manual |
| 5 | Estoque | Contadores de "abaixo do mínimo" e "repor" sobre todo o catálogo | Agregado de saúde do estoque; hoje a conta usa os primeiros 200 produtos (limite da API) | Contam até 200 produtos |
| 4 | Equipe | Escala semanal e capacidade por profissional | Jornada, horários e capacidade por profissional | Omitidas; a tela usa cadastro de profissionais e resumo de comissão disponíveis |
| 4 | Fechamento | Total de cobranças pendentes e planos próximos do fim | Agregados completos, filtráveis por período, para faturas em aberto e planos perto do fim | Omitidos; a consulta limitada aos 100 primeiros registros podia mostrar totais incompletos |

## Pendências de frontend (fases seguintes)

Itens que não dependem do backend, mas que a fase 1 não alcança por exigirem mudar a estrutura de cada tela:

- **Paginação "1-14 de 248"**: o componente já suporta (`pageSize`), mas cada tela precisa passar o tamanho da página.
- **Rótulos em caixa-alta com espaçamento** (cerca de 150 ocorrências) e **grades de cartões de KPI**: viram faixa de métricas (`dl`) tela a tela.
- **Gradientes de destaque** que usam `var(--accent)` (por exemplo, o cartão "Atendimentos do dia"): hoje resolvem para tinta; serão trocados pela faixa de métricas.
- **Variáveis antigas** `--pet-*` (24 usos) e `--accent*` (135 usos): na fase 1 elas apontam para os tokens v2; o uso direto sai à medida que cada tela é refeita.
- **Frases de efeito e textos de "demo"** nos catálogos de mensagens: revisados junto com cada tela.
- **Contatos de apoio / Contatos do CRM** (`modules/crm/contacts-page.tsx` e `contact-form-page.tsx`): a tela é compartilhada entre a Gestão Pet e o CRM e ainda tem textos fixos no código, sem acento e fora dos catálogos de i18n. Na fase 3 ganhou contagem no título, paginação com `pageSize` e perdeu os cartões de métrica na superfície pet; a migração completa dos textos fica para a fase 6, junto com o Comercial.
- **Tarefas, notas e atividade do CRM** (`modules/crm/tasks-page.tsx`, `notes-page.tsx`, `activity-page.tsx`), usadas no Follow-up: na fase 4 ganharam título, filtros e paginação v2 na superfície pet, mas ainda têm textos fixos fora do i18n e o formulário de tarefa/nota fica sempre aberto acima da lista. Migração dos textos e editor sob demanda ficam para a fase 6.

## Decisões registradas

- **Escopo do visual v2**: os tokens, a fonte IBM Plex e os componentes `.ui-*` valem dentro de `[data-surface='app']`, que o `AppShell` aplica à raiz e ao `<body>` enquanto está montado. O site público, o login e a recuperação de senha (fase 7) mantêm o visual atual até sua fase.
- **Paletas do Tailwind**: `slate`, `emerald`, `amber`, `red`, `rose`, `blue`, `sky`, `violet` e `white` leem variáveis CSS. Fora do app usam os valores originais da Tailwind; dentro do app viram neutros (tons 50-300) e as cores semânticas do v2 (tons 400+). No tema escuro a escala se inverte.
- **Fase 2, Hoje**: `/dashboard`, `/pet` e `/pet/dashboard` abrem a mesma tela "Hoje". A antiga tela `/pet` (cartões de "Workspace", código do ambiente) foi removida, assim como a aba duplicada "Workspace" da sub-navegação.
- **Fase 2, Agenda**: visões Dia (grade por profissional, padrão), Lista e Mês. "Semana" não depende de dado novo e fica como evolução de frontend.
- **Fase 2, PDV**: os quatro cartões de resumo mostravam números fixos no código (vendas, faturamento, ticket médio, itens) e foram removidos. Corrigido também um erro antigo: o PDV pedia 500 itens por página, acima do limite da API (200), e ficava sem produtos e clientes sem avisar.
- **Fase 3, Clientes e Pets**: os cartões de métrica contavam só os registros da página atual e foram removidos; o total vai no título. A seleção em lote usa apenas ações que já existem (exportar CSV no navegador). Datas passam a seguir o idioma ativo.
- **Fase 3, Perfil do pet**: a tela `/pet/pets/[id]/timeline` é o perfil do pet e exige só `pet.profile.read` (antes exigia permissões clínicas e bloqueava a equipe de banho e tosa). Mostra dados do pet, cuidados, atendimentos e tutor; o histórico clínico e as vacinas aparecem apenas para quem tem as permissões clínicas.
- **Fase 4, Fechamento**: o resumo de comissão da API é a fonte dos indicadores do período. Foram removidos os números de cobranças e planos derivados de uma única página de até 100 registros, pois não representavam totais confiáveis. Valores e datas passam a seguir o idioma ativo.
- **Fase 4, Serviços**: o editor abre sob demanda e cada linha tem um liga/desliga "Ativo" que reenvia o serviço com os mesmos campos pelo `PUT` já existente; ativar um serviço sem caminho de agendamento (nem avulso nem plano) é bloqueado na tela, como no formulário.
- **Fase 5, Financeiro**: `/pet/finance` exibia movimentos, faturas e pagamentos fictícios fixos no código, e o "Novo lançamento" gravava só na memória da tela. Por decisão do dono do projeto, a tela passou a usar apenas a API: contagens do servidor e os registros mais recentes, com links para `/finance/*`. Cada bloco trata sozinho a falta de acesso, porque o menu também aparece para quem só tem `pet.invoice.read`.
- **Fase 5, telas de `/finance`**: os filtros de categoria de caixa e de status de pagamento tinham valores que não existem na API e nunca filtravam nada; agora seguem os enums `FinanceCashCategory` e `FinancePaymentStatus`. O tipo `FinancePayment` do frontend declarava `paidAt`, mas a API devolve `receivedAt`, e a data do pagamento nunca aparecia; o tipo foi corrigido.
- **Fase 5, Estoque**: `/inventory` era um hub sem nenhum link apontando para ele e só levava a `/pet/inventory`; o hub foi removido e a rota abre a tela de Estoque. O indicador "saídas visíveis" contava só a página atual e saiu; os demais vêm do catálogo.
- **Fase 5, Produtos e Cobrança**: cartões que contavam só a página atual foram removidos; o editor abre sob demanda. O "próximo ciclo" de Cobrança continua projetando sobre os primeiros 200 planos e atendimentos.
- **Fase 4, Planos**: o "Radar de renovação" (quatro cartões com contagens da página atual) foi removido; o estado de cada plano aparece na linha. A configuração de mensagens de cobrança virou um bloco recolhível no fim da página e o lembrete PIX preparado aparece como seção própria acima da tabela.
- **Status como ponto**: `StatusBadge` agrupa os status em aguardando (cinza: agendado, confirmado, pendente), em atendimento (azul), concluído (verde), atenção (`warn`) e erro/cancelado (`danger`). A separação "No banho" / "Na tosa" e o estágio "Retirado" da fila serão tratados na fase 2, conforme a regra de estágios do prompt.
