# Fundacao de Productizacao por Tenant

## O que mudou

Esta iteracao estabelece a primeira base de productizacao da experiencia autenticada do SaaS.

Areas implementadas:

- campos de branding de tenant no modelo core de tenant
- preferencias de tema do tenant com `LIGHT`, `DARK` e `SYSTEM`
- politica de controle do tenant sobre override de tema pelo usuario
- dados explicitos de modulos contratados nas respostas de tenant
- modelo de administracao da plataforma baseado no role existente `PLATFORM_ADMIN`
- payload de auth enriquecido com contexto real do tenant para o frontend
- shell e sidebar contextuais dirigidos por dados reais do tenant, sem heuristica local
- tela de administracao de tenants com branding, tema e contratos de modulo

## Modelo de acesso

O modelo atual de administrador global da plataforma agora esta formalizado assim:

- `PLATFORM_ADMIN` continua sendo o role code existente
- administracao ampla da plataforma so e valida quando o usuario autenticado esta dentro de um tenant marcado com `platformOwner = true`
- endpoints de administracao de tenants ficam restritos a administradores do tenant dono da plataforma
- usuarios de tenants comuns continuam operando por permissoes do tenant e modulos contratados

Isso evita criar um role paralelo `SYS_ADMIN` e ao mesmo tempo respeita a regra de negocio de que apenas a PhaifferTech deve ter acesso total a plataforma.

## Modelo de branding do tenant

O modelo de tenant agora suporta campos de branding controlado:

- `logoUrl`
- `primaryColor`
- `accentColor`
- `defaultThemeMode`
- `allowUserThemeOverride`
- `platformOwner`

O branding continua intencionalmente controlado:

- as cores do tenant aparecem em acentos e destaques
- superficies e tokens estruturais continuam sob controle do design system
- o branding nao substitui todo o conjunto de tokens da plataforma

## Modelo de tema

O shell autenticado agora suporta:

- `light`
- `dark`
- `system`

Regras de resolucao do tema:

- se o tenant permitir override, o usuario pode armazenar preferencia local
- se o tenant nao permitir override, o shell segue o tema padrao do tenant
- o antigo toggle `styleMode` do shell foi removido porque nao representava uma configuracao real de produto

## Modelo de navegacao e visibilidade

A visibilidade da sidebar agora vem de:

- identidade atual do tenant vinda do auth
- status de platform admin vindo do auth
- disponibilidade de modulos contratados via `/api/v1/modules`
- checks de permissao que o app ja utilizava

Efeitos principais:

- branding e nome do tenant passam a vir do contexto real
- o seletor fake de escopo foi removido
- a navegacao de administracao de tenants aparece apenas para administradores do tenant dono da plataforma
- tenants comuns veem apenas areas de modulos contratados e secoes core relevantes para o seu workspace

## Fluxo de administracao de tenants

A tela de administracao de tenants agora explicita:

- configuracao de branding
- tema padrao
- se usuarios podem sobrescrever o tema
- modulos contratados

`CORE_PLATFORM` permanece implicitamente ativo para todos os tenants e e tratado como acesso fundamental da plataforma.

## Racional arquitetural

Esta implementacao preserva a arquitetura existente:

- regras ficam em `core`, nao em modulos verticais de negocio
- CRM e Pet continuam sem dependencia direta entre modulos de negocio ativos
- o frontend preserva `app` como roteamento e reaproveita a estrutura compartilhada de shell/componentes
- nao houve redesign de areas autenticadas sem relacao com esta fase

## Limitacoes atuais

- a administracao de tenants ainda usa o catalogo de modulos do tenant autenticado como fonte de opcoes, o que e seguro para o tenant dono da plataforma, mas ainda nao e um endpoint dedicado de catalogo global
- as paginas especificas dos modulos ainda nao foram totalmente adaptadas ao novo sistema de tema; esta iteracao foca em shell e fundacoes compartilhadas
- a gestao de usuarios continua tenant-scoped e ainda usa o fluxo atual de list/create

## Proximo passo recomendado

O proximo passo de menor risco e continuar a productizacao pela coerencia de dashboard e settings:

- tornar o dashboard global explicitamente tenant-aware em copy e cards
- expor preview de branding e regras de validacao nas configuracoes/admin
- adicionar um endpoint dedicado de catalogo global de modulos se a administracao de contratos de tenant precisar ficar totalmente independente da visao de disponibilidade do tenant atual
