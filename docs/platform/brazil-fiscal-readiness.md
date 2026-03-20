# Brazil Fiscal Readiness

This phase prepares the platform for future Brazilian fiscal integration without adding a fiscal engine or wiring an external provider.

## What is ready now

- `finance_invoices` now supports fiscal readiness snapshots for issuer, recipient, provider code, tax regime, fiscal document type, number, and series.
- `tenant_fiscal_profiles` stores tenant-scoped issuer defaults and provider selection without forcing all tenants to enable fiscal behavior.
- A `finance.fiscal` entitlement key allows fiscal readiness to stay contract-driven per tenant.
- `BrazilFiscalProvider` and `BrazilFiscalProviderRegistry` define the provider boundary. The current `NOOP` provider makes readiness explicit without pretending emission is available.
- Invoice readiness can be assessed through `/api/v1/finance/invoices/{id}/fiscal-readiness`.

## Provider boundary

The provider boundary is intentionally small:

- `BrazilFiscalProvider` exposes `submitInvoice` and `cancelInvoice`.
- `BrazilFiscalProviderContext` carries the tenant fiscal profile and the finance invoice snapshot.
- `BrazilFiscalProviderRegistry` resolves the configured provider code with a safe fallback to `NOOP`.

This keeps provider integration outside the finance core lifecycle and avoids invasive refactors when the real fiscal phase starts.

## Contract-driven tenant behavior

- Tenants can store a fiscal profile before fiscal entitlement is granted.
- Readiness only becomes effectively enabled when both conditions are true:
  - the tenant has `finance.fiscal`
  - the fiscal profile is marked as enabled
- This lets sales/implementation teams preconfigure tenants without enabling emission behavior prematurely.

## What should wait for the real fiscal phase

- NF-e/NFS-e provider adapters and credential management
- certificate handling, signing, and secure secret storage
- XML generation and validation against fiscal schemas
- item-level tax composition such as CFOP, CST/CSOSN, ISS, ICMS, PIS, and COFINS
- legal numbering strategies, series control, retries, polling, callbacks, and contingency
- cancellation, correction letters, event history, and reconciliation flows
- full address, municipality, and service-code completeness rules
- DANFE, RPS, PDF rendering, and fiscal document distribution
