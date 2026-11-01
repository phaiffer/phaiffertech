# Frontend, Gestão Pet

Aplicação Next.js com o site público, o login e a área autenticada da plataforma (painel, telas Gestão Pet de banho e tosa, financeiro, estoque e administração).

## Stack

- Next.js 15 (App Router), React 18, TypeScript 5
- Tailwind CSS 3 com tokens de design em variáveis CSS
- Vitest + Testing Library

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

No Windows, a partir da raiz do monorepo, prefira `.\scripts\start-local-frontend.ps1`: ele carrega `.env.local` e usa `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` por padrão.

Verificações (as mesmas do CI):

```bash
npm test
npm run lint
npm run build
```

`tsc` e os testes não detectam tudo que quebra o build do Next. Exemplo real: um `import` antes de `'use client'` passa no `tsc`, mas falha no `npm run build`. Rode o build antes de abrir PR.

## Estrutura

```text
src/
├── app/
│   ├── (public)/        # site institucional, /login, /forgot-password, /reset-password
│   └── (app)/           # área autenticada: /dashboard, /pet/*, /finance/*, /inventory, /settings, /tenants, /users
├── modules/             # telas por domínio: pet, crm, finance, inventory, website
└── shared/
    ├── auth/            # sessão, ProtectedRoute, usePermissions, PermissionGuard
    ├── entitlements/    # entitlements do plano do tenant (pet.aesthetics, pet.veterinary...)
    ├── modules/         # ModuleGuard e disponibilidade de módulos
    ├── services/        # clientes da API por domínio (pet-service, finance-service...)
    ├── lib/             # http (ApiClientError), api-error-message
    ├── i18n/            # provider, formatadores e catálogos de mensagens
    ├── dashboard/       # widgets de painel (SummaryCard, StatusBadge, gráficos simples)
    ├── components/      # app shell, sidebar, banner de impersonação
    └── ui/              # DataTable, Pagination, SearchBar, formulários, ConfirmDialog
```

As páginas em `app/` são finas: importam a tela de `modules/<domínio>` e a envolvem nos guards necessários.

## Acesso às telas

Uma tela só aparece quando quatro condições são verdadeiras:

1. Usuário autenticado (`ProtectedRoute`).
2. Módulo disponível para o tenant (`ModuleGuard`; o backend também bloqueia com `403`).
3. Permissão do usuário (`PermissionGuard` / `usePermissions`).
4. Entitlement do plano (`shared/entitlements/tenant-entitlements.ts`). É assim que as telas clínicas ficam ocultas no plano de banho e tosa.

O menu lateral aplica as mesmas regras para esconder itens.

## Internacionalização (i18n)

Idiomas: **pt-BR** (padrão) e **en-US**. A escolha fica no `localStorage` (`phaiffertech-locale`) e o provider atualiza `<html lang>`. Nos testes, o idioma padrão é en-US.

### Catálogos

Ficam em `src/shared/i18n/messages/`:

| Arquivo | Conteúdo |
| --- | --- |
| `pt-br.ts` | Catálogo principal em pt-BR. É a fonte do tipo `AppMessages` |
| `en-us.ts` | Tradução en-US, tipada como `AppMessages` |
| `screens-pt-br.ts` / `screens-en-us.ts` | Seção `screens`: textos das telas, uma chave por tela (`petInvoices`, `petServices`, `shell`, `website`...) |
| `index.ts` | `getAppMessages(locale)` |

Como o catálogo en-US é tipado a partir do pt-BR, uma chave que existe em um idioma e falta no outro quebra o `tsc`.

### Usando em um componente

```tsx
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale } from '@/shared/i18n/formatters';

export function InvoicePaidLabel({ paidAt }: { paidAt: string }) {
  const copy = useAppMessages().screens.petInvoices;
  const { locale } = useAppI18n();

  // pt-BR: 'Pago em {date}' / en-US: 'Paid on {date}'
  return <span>{copy.paidOnDate.replace('{date}', formatDateForLocale(locale, paidAt))}</span>;
}
```

Convenções:

- **Nenhum texto visível fixo no JSX.** Todo texto novo entra nos dois catálogos ao mesmo tempo.
- **Interpolação** com marcadores `{nome}` e `.replace('{nome}', valor)`. Monte a frase inteira no catálogo; não concatene pedaços como `'Página ' + n + ' de ' + total`, porque a ordem das palavras muda entre idiomas.
- **Helpers fora do componente** recebem `copy` como parâmetro (por exemplo, `formatStatusLabel(copy, status)`) em vez de importar textos.
- **Datas, números e moeda** sempre via `shared/i18n/formatters.ts`, nunca com `toLocaleString` solto.
- **Testes** procuram os textos em inglês, porque esse é o idioma padrão nos testes.
- **pt-BR com acentuação correta**: "Não", "Serviço", "está"/"esta" conforme o sentido.

### Erros da API

O backend devolve mensagens de erro em inglês. Para não misturar idiomas na tela, use `resolveApiErrorMessage` (`src/shared/lib/api-error-message.ts`):

```ts
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

try {
  await loadInvoices();
} catch (error) {
  setError(resolveApiErrorMessage(error, copy.loadError));
}
```

- Em en-US, mostra a mensagem do backend quando o erro é um `ApiClientError`.
- Em pt-BR, mostra o texto traduzido da própria tela (o segundo argumento).

Contrapartida: em pt-BR a mensagem é mais genérica que a do backend. Para mostrar o motivo exato nos dois idiomas, o backend precisaria devolver códigos de erro estáveis, que o frontend traduziria.

### Cobertura atual

Todas as telas de banho e tosa, o app shell, o painel, o login e a recuperação de senha e o site público estão nos catálogos. As telas de CRM, clínica veterinária e administração (tenants e usuários) ainda têm textos fixos. Elas ficam ocultas no plano de banho e tosa e devem ser migradas com as mesmas convenções quando voltarem ao escopo.

## Observações de execução

- Os painéis renderizam apenas o payload agregado do backend; o frontend não consulta dados internos de outros módulos.
- Painéis de módulo exigem permissão de dashboard mesmo quando o módulo está habilitado.
