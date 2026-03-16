# Platform Operations Runbook

## Scope

This runbook covers the minimum operational procedures for the current platform scope:

- local startup
- backend deployment preparation
- password reset
- tenant creation
- health validation
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
curl -fsS http://localhost:8080/api/v1/health
curl -fsS http://localhost:8080/actuator/health
curl -fsS http://localhost:8080/actuator/health/readiness
```

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

## Create a Tenant

Tenant creation is currently an authenticated platform-admin operation through `POST /api/v1/tenants`.

Example request body:

```json
{
  "name": "Acme Manufacturing",
  "code": "acme-manufacturing",
  "primaryColor": "#0f172a",
  "accentColor": "#2563eb",
  "contractedModules": ["CORE_PLATFORM", "CRM", "IOT"]
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
