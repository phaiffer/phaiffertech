# Frontend - Platform Console

Next.js admin console for the unified platform.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Current Scope

- Login integrated with backend JWT auth.
- Authenticated app shell (sidebar + header + content).
- Session model with user, roles and permissions.
- Auth guard for protected routes.
- Permission guard for actions/components.
- Sidebar visibility by permission.
- CRM v1 UI:
  - contacts list/create/edit/delete
  - leads list/create/edit/delete
  - search + pagination + loading/empty/error states

## Key Shared Modules

- `src/shared/auth`
  - `useAuth`
  - `ProtectedRoute`
- `src/shared/auth`
  - `usePermissions`
  - `PermissionGuard`
- `src/shared/permissions`
  - `hasPermission` / `hasAnyPermission` (low-level helpers)
- `src/shared/services`
  - centralized API client usage
- `src/shared/ui`
  - `DataTable`, `Pagination`, `SearchBar`, `FormInput`, `FormSelect`, `ConfirmDialog`

## Pages

- `/login`
- `/dashboard`
- `/tenants`
- `/users`
- `/crm`
- `/crm/contacts`
- `/crm/contacts/new`
- `/crm/contacts/[id]`
- `/crm/leads`
- `/crm/leads/new`
- `/crm/leads/[id]`
- `/pet`
- `/iot`
- `/settings`

## Run

```bash
npm install
npm run dev
```

From monorepo root:

```bash
make frontend
```

## Quality Checks

```bash
npm run lint
npm run build
```
