# Redesign do Site Público

## O que mudou

A área pública de `apps/frontend` foi expandida de uma superfície mínima de home + login para um website institucional e técnico estruturado da PhaifferTech.

As rotas públicas agora cobrem:

- `/`
- `/about`
- `/platform`
- `/products`
- `/engineering`
- `/research`
- `/articles`
- `/articles/[slug]`
- `/contact`
- `/login`

O layout público agora usa o `PublicSiteShell` compartilhado, com navegação bilíngue, alternância de tema e footer alinhado ao posicionamento atual da empresa e da plataforma.

## Por que essa mudança era necessária

O repositório já expunha uma realidade arquitetural muito mais forte do que o site público anterior comunicava.

Antes deste redesign, a camada pública:

- parecia próxima demais de um ponto de entrada de login
- não explicava a plataforma modular com clareza
- não posicionava a PhaifferTech como marca séria de engenharia e pesquisa aplicada
- não ajudava adequadamente a credibilidade comercial nem a futura publicação técnica

O redesign foi implementado para tornar a camada pública compatível com:

- a arquitetura modular real da plataforma
- o portfólio atual de produtos
- o foco técnico em dados, cloud e sistemas operacionais
- a direção acadêmica e de pesquisa aplicada do projeto

## Estrutura

A implementação preserva a arquitetura atual do frontend:

- `src/app/(public)` continua como camada de roteamento
- `src/modules/website` passa a ser dona da composição das páginas públicas
- `src/shared/components` mantém apenas componentes públicos realmente reutilizáveis
- `src/shared/public` continua com estado de locale/theme e mensagens do shell/login

Arquivos principais introduzidos ou reorganizados:

- `apps/frontend/src/modules/website/website-content.ts`
- `apps/frontend/src/modules/website/website-sections.tsx`
- `apps/frontend/src/modules/website/website-*-page.tsx`
- `apps/frontend/src/app/(public)/**/page.tsx`
- `apps/frontend/src/shared/components/public-site-shell.tsx`

## Racional arquitetural

Esse redesign respeita as regras atuais do repositório porque:

- não mexe nas áreas autenticadas fora do escopo público
- mantém o roteamento público fino
- centraliza a composição pública em um módulo dedicado em vez de espalhar lógica em `app`
- não move regra de negócio de módulo para `shared`
- preserva o fluxo atual de login e o mantém separado do shell autenticado

## Estratégia de conteúdo

O website agora está estruturado para comunicar cinco camadas com clareza:

1. PhaifferTech como empresa de tecnologia
2. PhaifferTech Platform como fundação SaaS modular
3. Linhas de produto entre CRM, PetFlow e IoT System
4. Autoridade de engineering em dados, cloud e arquitetura de plataforma
5. Continuidade de pesquisa para estudos técnicos e visibilidade acadêmica

## Pontos de extensão futura

A implementação evita deliberadamente um CMS nesta fase, mas deixa pontos limpos de expansão para:

- publicação mais rica de artigos
- adoção futura de MDX/content layer
- notas de pesquisa e publicações acadêmicas
- páginas mais fortes de evidência de produto e estudos de caso

A estrutura atual de rotas de artigos já suporta crescimento sem exigir novo redesign da arquitetura pública de informação.

## Validação

O redesign do site público deve ser validado com:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Esses checks confirmam que as novas rotas públicas, o shell e o conteúdo bilíngue permanecem compatíveis com o codebase atual do frontend.
