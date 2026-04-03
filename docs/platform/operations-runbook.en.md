# Platform Operations Runbook

## Scope

This runbook covers the minimum operational procedures for the current platform scope:

- local startup
- backend deployment preparation
- password reset
- password reset local QA with MailHog
- support impersonation
- tenant creation
- health validation
- default tenant demo data
- log inspection
- troubleshooting login, CORS, and module access issues

## Start Locally

Start the local stack:

```bash
make up
```

Useful follow-up commands:

```bash
make status
make logs-backend
make db-shell
```

Validate the backend summary and readiness endpoints:

```bash
make smoke
```

Or manually:

```bash
curl -fsS http://localhost:8080/api/v1/health
curl -fsS http://localhost:8080/actuator/health
curl -fsS http://localhost:8080/actuator/health/readiness
```

> **MailHog warning**: The local stack starts MailHog on port 8025 (`http://localhost:8025`) to capture
> outgoing emails without delivering them. MailHog must never be exposed on a publicly reachable network
> interface in staging or demo environments. Any password reset link or notification email sent while
> MailHog is active is readable by anyone who can reach port 8025.

## Backend Deployment Preparation

Required production environment variables:

- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

Recommended production security variables:

- `APP_SECURITY_JWT_ISSUER`
- `APP_SECURITY_JWT_REFRESH_COOKIE_SECURE=true`
- `APP_SECURITY_JWT_REFRESH_COOKIE_SAME_SITE=Strict`
- `APP_SECURITY_PUBLIC_DOCS_ENABLED=false`
- `APP_SECURITY_PUBLIC_OBSERVABILITY_ENABLED=false`
- `MANAGEMENT_TRACING_ENABLED=false` unless an OTLP collector is configured intentionally

Operational notes:

- keep `/actuator/prometheus` and documentation endpoints private unless there is an explicit operational need
- terminate HTTPS at the reverse proxy or load balancer and preserve forwarded headers
- use a Base64 JWT secret that decodes to at least 32 bytes

## Reset a User Password

Preferred path for a signed-in user:

- call `POST /api/v1/auth/change-password`
- this revokes active refresh sessions for that user

Operator-assisted reset path when the user cannot sign in:

1. Generate a BCrypt hash with a trusted tool compatible with Spring Security BCrypt.
2. Update the user and revoke active refresh tokens:

```sql
UPDATE users
SET password_hash = '<bcrypt-hash>',
    updated_at = NOW(),
    updated_by = 'ops-password-reset'
WHERE email = 'user@example.com';

UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
  AND revoked_at IS NULL;
```

3. Ask the user to sign in again with the new password.

## Local QA: Password Reset with MailHog

Use this flow to verify the end-to-end password reset path in a local environment.

Prerequisites:

- local stack running (`make up`)
- MailHog UI accessible at `http://localhost:8025`
- a user account exists with a known email and tenant code

Steps:

1. Open the forgot-password page in the frontend (`http://localhost:3000/forgot-password`).
2. Enter the user email and submit. The page should show a generic success message regardless of whether the email exists.
3. Open MailHog at `http://localhost:8025` and locate the reset email. The email subject and body contain a password reset link.
4. Copy the reset link from the email body and open it in the browser. The link points to `http://localhost:3000/reset-password?token=<token>`.
5. Enter and confirm the new password on the reset form and submit.
6. Verify the following:
   - the form shows a success confirmation
   - logging in with the old password fails
   - logging in with the new password succeeds

If no email appears in MailHog:

- check that `MAIL_HOST=localhost` and `MAIL_PORT=1025` are set in `.env`
- confirm the backend environment shows `MAIL_HOST=mailhog` (Docker Compose overrides the host)
- check backend logs for mail delivery errors with `make logs-backend`

If the reset link returns an error:

- confirm `APP_PASSWORD_RESET_URL_BASE=http://localhost:3000/reset-password` is set
- tokens expire after `APP_PASSWORD_RESET_EXPIRY_MINUTES` (default: 30 minutes)
- each token is single-use; requesting a new reset invalidates the previous token

## Support Impersonation

Platform admins can impersonate a tenant user to diagnose access or permission issues without requiring the user's password.

**When to use**:

- a tenant admin reports an access problem that cannot be reproduced with the platform admin account
- a support operator needs to verify the effective entitlements and module visibility from the tenant perspective
- post-incident access verification after a permission change

**How it works**:

1. The platform admin calls `POST /api/v1/auth/impersonate` with the target tenant ID, user ID, and a reason string.
2. The response returns a short-lived access token scoped to the target user's tenant and permissions.
3. All actions taken with that token are recorded in the audit log with an `impersonation` context that includes the session ID and originating admin ID.
4. The impersonation session is ended by calling `POST /api/v1/auth/impersonate/stop` or by letting the token expire.

**Security constraints**:

- only `PLATFORM_ADMIN` role can start an impersonation session
- impersonated sessions remain bound to the target tenant — they cannot cross tenant boundaries
- impersonation sessions appear in the `support_impersonation_sessions` table and in the `audit_logs` table
- impersonated actions are visually flagged in the `/me` response with `supportImpersonation` context

**Audit check SQL**:

```sql
SELECT session_id, admin_user_id, target_tenant_id, target_user_id, reason, started_at, ended_at
FROM support_impersonation_sessions
ORDER BY started_at DESC
LIMIT 20;
```

## Create a Tenant

Tenant creation is currently an authenticated platform-admin operation through `POST /api/v1/tenants`.

Example request body:

```json
{
  "name": "Acme Manufacturing",
  "code": "acme-manufacturing",
  "primaryColor": "#0f172a",
  "accentColor": "#2563eb",
  "contractedModules": ["CORE_PLATFORM", "PET"]
}
```

Minimal validation after creation:

- the tenant exists in `tenants`
- expected rows exist in `tenant_modules`
- the intended admin user has an active row in `user_tenants`

## Validate System Health

Use these endpoints in order:

- `/api/v1/health`
  - safe summary for simple external checks
- `/actuator/health`
  - aggregated application health
- `/actuator/health/readiness`
  - deployment readiness check
- `/actuator/health/liveness`
  - process liveness check

Expected production behavior:

- health endpoints are publicly reachable only for the health path family
- health responses do not expose sensitive internal details in `prod`
- readiness includes database and migration state

## Default Tenant Demo Data

The initial Flyway migration (V5) creates a tenant with code `default` in every environment. A later migration (V46) seeds representative demo records into that tenant — finance invoices, inventory items, CRM tasks, and legacy IoT alarms — to support historical dashboard and alert surface demonstrations.

The current local commercial demo bootstrap is separate from V46 and seeds CRM plus PetFlow data only.

In a production environment this demo data is present in the database but is not accessible through normal application flows because no user is assigned to the `default` tenant by default (user creation is explicitly excluded from V5 and only happens via the `dev`-profile `DevelopmentDataSeeder`). The `default` tenant exists and has enabled modules, but it has no active users.

If you want to remove the demo records from a production database after initial migration:

```sql
-- Remove V46 demo enrichment records from the default tenant
-- Safe to run multiple times (deletes by fixed UUIDs)
DELETE FROM iot_alarms       WHERE id IN ('bbbbbbb1-0000-0000-0000-000000000002', 'bbbbbbb1-0000-0000-0000-000000000003');
DELETE FROM crm_tasks        WHERE id IN ('d1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000003');
DELETE FROM inventory_items  WHERE id IN ('e1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', 'e1111111-0000-0000-0000-000000000003');
DELETE FROM finance_invoices WHERE id IN ('f1111111-0000-0000-0000-000000000001', 'f1111111-0000-0000-0000-000000000002', 'f1111111-0000-0000-0000-000000000003', 'f1111111-0000-0000-0000-000000000004');
```

## Check Logs

Local Docker workflow:

```bash
make logs-backend
docker compose logs --tail=200 backend
```

What to look for first:

- authentication failures
- Flyway migration failures
- foreign-key violations during seed/bootstrap flows
- repeated `401` or `403` responses
- proxy/header mismatches on login or CORS requests

## Troubleshoot Login Issues

Check in this order:

1. tenant code exists and is active
2. user exists and is active
3. `user_tenants` row exists and is active for that tenant
4. role bindings exist in `user_tenant_roles`
5. brute-force limits are not blocking the source IP
6. refresh cookie policy matches the deployment topology

Useful SQL checks:

```sql
SELECT id, code, status FROM tenants WHERE code = 'tenant-code';
SELECT id, email, active FROM users WHERE email = 'user@example.com';
SELECT tenant_id, user_id, active FROM user_tenants WHERE user_id = '<user-id>';
```

## Troubleshoot CORS Issues

Check in this order:

1. `APP_CORS_ALLOWED_ORIGINS` contains the exact frontend origin
2. the browser origin matches scheme, host, and port exactly
3. the frontend is sending credentials only to the expected backend origin
4. production cookies use `Secure=true` when the public origin is HTTPS
5. the reverse proxy forwards `X-Forwarded-Proto` correctly

Common failure patterns:

- wildcard origins with credentials enabled
- HTTPS frontend calling an HTTP backend origin
- missing forwarded-proto header causing mixed cookie expectations

## Troubleshoot Module Access Problems

Check in this order:

1. the tenant has the module enabled in `tenant_modules`
2. the authenticated user has the required permission
3. the request carries the correct `X-Tenant-Id`
4. the tenant header matches the tenant encoded in the access token

Useful SQL checks:

```sql
SELECT tenant_id, module_definition_id, enabled
FROM tenant_modules
WHERE tenant_id = '<tenant-id>';

SELECT ut.tenant_id, u.email, r.code
FROM user_tenants ut
JOIN users u ON u.id = ut.user_id
JOIN roles r ON r.id = ut.role_id
WHERE u.email = 'user@example.com';
```
