# Commercial Demo Environment

## Purpose

This demo environment creates a single official tenant for commercial walkthroughs:

- Tenant code: `phaiffertech-demo`
- Default demo user: `demo@phaiffertech.local`
- Default demo password in local `dev`: `Demo@123`

The dataset is isolated to the demo tenant and keeps CRM, PetFlow, and IoT aligned around one commercial showcase.

## How It Is Seeded

The backend now includes a controlled bootstrap under `app.demo.commercial`.

When the backend runs with the local `dev` profile, `application-dev.yml` enables the bootstrap automatically and recreates the demo tenant on startup.

The bootstrap seeds:

- CRM companies, contacts, leads, pipeline stages, deals, tasks, notes, and recent activity.
- PetFlow clients, pets, appointments, medical records, vaccinations, products, inventory movements, and invoices.
- IoT devices, registers, telemetry, alarms, and maintenance orders.

## How To Create The Demo Tenant

In local development, start or restart the backend with the `dev` profile.

The demo tenant and its dataset are recreated automatically during backend startup.

To override the default credentials or tenant labels, set these environment variables before starting the backend:

- `APP_DEMO_COMMERCIAL_ENABLED`
- `APP_DEMO_COMMERCIAL_TENANT_CODE`
- `APP_DEMO_COMMERCIAL_TENANT_NAME`
- `APP_DEMO_COMMERCIAL_USER_EMAIL`
- `APP_DEMO_COMMERCIAL_USER_PASSWORD`
- `APP_DEMO_COMMERCIAL_USER_FULL_NAME`

## How To Reset The Demo Dataset Locally

Use the backend bootstrap itself as the reset mechanism.

1. Stop the backend.
2. Start the backend again with the `dev` profile.
3. The bootstrap clears the previous `phaiffertech-demo` tenant dataset and rebuilds it from the official fixture set.

This reset only rebuilds demo-tenant business data. It does not remove other tenants.

If you need a full local database reset for every tenant, use the local development database workflow and recreate the database volume before starting the backend again. That is a local-only operation and should not be treated as a production procedure.
