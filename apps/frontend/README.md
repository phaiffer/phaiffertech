# Frontend - Platform Console

Frontend Next.js (App Router + TypeScript + Tailwind) para operar a plataforma SaaS multi-tenant.

## Stack

- Next.js 14
- TypeScript
- App Router
- Tailwind CSS

## Estrutura principal

```text
src/
├── app/
├── modules/
└── shared/
```

## Funcionalidades iniciais

- Tela de login integrada ao backend (`/api/v1/auth/login`).
- Controle de sessão inicial (access/refresh token em localStorage).
- Layout autenticado com sidebar + header + área de conteúdo.
- Páginas funcionais:
  - Dashboard
  - Tenants
  - Users
  - CRM
  - Pet
  - IoT
  - Settings
- Cliente HTTP centralizado com headers de `Authorization` e `X-Tenant-Id`.

## Rodar localmente (sem Docker)

```bash
npm install
npm run dev
```

Aplicação em `http://localhost:3000`.
