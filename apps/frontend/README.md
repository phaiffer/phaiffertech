# Frontend - Platform Console

Next.js admin console for the PetFlow-first platform experience.

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
- Sidebar visibility by permission and backend module enablement.
- Global error boundary and client-side structured logging.
- Shared dashboard widget layer for cards, lists and simple charts.
- CRM v1 UI:
  - dashboard summary
  - contacts list/create/edit/delete
  - leads list/create/edit/delete
  - search + pagination + loading/empty/error states
- PET v1 UI:
  - dashboard summary
  - clients list/create/edit/delete
  - pet profiles list/create/edit/delete
  - appointments list/create/edit/delete
  - search, filters, pagination and permission-aware actions

## Key Shared Modules

- `src/shared/auth`
  - `useAuth`
  - `ProtectedRoute`
- `src/shared/auth`
  - `usePermissions`
  - `PermissionGuard`
- `src/shared/permissions`
  - `hasPermission` / `hasAnyPermission`
  - `PermissionGate`
- `src/shared/services`
  - centralized API client usage (`crm-service`, `pet-service`, `finance-service`, etc.)
- `src/shared/dashboard`
  - reusable dashboard widgets and section renderers
- `src/shared/observability`
  - client logger for structured browser-side logs
- `src/shared/ui`
  - `DataTable`, `Pagination`, `SearchBar`, `FormInput`, `FormSelect`, `DateTimeInput`, `ConfirmDialog`

## Pages

- `/login`
- `/dashboard`
- `/tenants`
- `/users`
- `/crm`
- `/crm/dashboard`
- `/crm/contacts`
- `/crm/contacts/new`
- `/crm/contacts/[id]`
- `/crm/leads`
- `/crm/leads/new`
- `/crm/leads/[id]`
- `/pet`
- `/pet/dashboard`
- `/pet/clients`
- `/pet/pets`
- `/pet/appointments`
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

## Runtime Notes

- Feature flags and module enablement are resolved server-side and reflected in module navigation.
- Module-disabled API access returns `403` from backend guard, and UI sections are hidden from sidebar.
- Module dashboards require explicit dashboard permissions even when the module is enabled for the tenant.
- The global dashboard renders only the backend aggregation payload and does not query module internals directly.
- Historical `iot.enabled` flags and `iot` usage metrics can still appear in upgraded datasets and remain filtered from the visible product surface.
