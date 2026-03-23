# Deployment Readiness Checklist

Use this checklist before marking a backend deployment as ready.

## Configuration

- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` are set correctly
- `APP_SECURITY_JWT_SECRET` is present, Base64-encoded, and not reused from local development
- `APP_CORS_ALLOWED_ORIGINS` matches the real frontend origin set
- `APP_SECURITY_JWT_REFRESH_COOKIE_SECURE=true`
- `APP_SECURITY_JWT_REFRESH_COOKIE_SAME_SITE` is set intentionally
- `APP_SECURITY_PUBLIC_DOCS_ENABLED=false` unless explicitly justified
- `APP_SECURITY_PUBLIC_OBSERVABILITY_ENABLED=false` unless explicitly justified
- `MANAGEMENT_TRACING_ENABLED` matches whether an OTLP collector is actually available

## Startup

- the backend starts without configuration validation failures
- Flyway completes successfully (check migration version at `/actuator/health/readiness`)
- no repeated authentication, cookie, or CORS errors appear in startup logs
- no repeated OTLP export errors appear unless tracing was intentionally enabled
- `make smoke` (or equivalent curl calls) passes against the target host

## Health

- `GET /api/v1/health` returns `UP`
- `GET /actuator/health` returns `UP`
- `GET /actuator/health/readiness` returns `UP`
- `GET /actuator/health/liveness` returns `UP`
- production health responses do not leak internal component details

## Security

- login sets `HttpOnly` refresh cookies
- production login sets `Secure` refresh cookies
- production login uses the intended `SameSite` policy
- auth responses include `Cache-Control: no-store`
- public docs and public observability endpoints are disabled unless deliberately required
- the reverse proxy forwards `X-Forwarded-For` and `X-Forwarded-Proto`

## Data and Access

- the target database is reachable from the backend runtime
- tenant bootstrap or demo bootstrap jobs complete without FK violations
- a platform admin can log in successfully
- a tenant admin can load their dashboard successfully
- at least one permission-protected module endpoint still returns `403` for a user without permission
- the `default` tenant demo records from migration V46 are acknowledged or cleaned up (see operations-runbook for cleanup SQL)

## Logs

- request logs show normal `2xx` and expected `4xx` patterns only
- no passwords, raw tokens, or secret values are present in logs
- stack traces are absent during normal startup and login flows
