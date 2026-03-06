# Frontend - Platform Console

Next.js admin console for the unified multi-tenant platform.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Structure

```text
src/
├── app/
├── modules/
└── shared/
```

## Current Features

- Login integrated with backend JWT auth.
- Session state with user role and permissions.
- Authenticated layout with sidebar + header + content.
- CRM v1 pages:
  - `/crm`
  - `/crm/contacts`
  - `/crm/leads`
- Shared reusable UI components:
  - `DataTable`
  - `Pagination`
  - `FormInput`
  - `FormSelect`
- Centralized HTTP client with tenant and auth headers.

## Run Locally

```bash
npm install
npm run dev
```

or from monorepo root:

```bash
make frontend
```

## Build and Lint

```bash
npm run lint
npm run build
```
