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
- Session state (access token, refresh token, authenticated user).
- Authenticated layout with sidebar + header + content.
- Pages:
  - Dashboard
  - Tenants
  - Users
  - CRM
  - Pet
  - IoT
  - Settings
- Centralized HTTP client with `Authorization` and `X-Tenant-Id` headers.

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
npm run build
npm run lint
```
