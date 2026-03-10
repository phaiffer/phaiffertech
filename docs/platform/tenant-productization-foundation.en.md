# Tenant Productization Foundation

## What changed

This iteration establishes the first productization foundation for the authenticated SaaS experience.

Implemented areas:

- tenant branding fields in the core tenant model
- tenant theme preferences with `LIGHT`, `DARK` and `SYSTEM`
- tenant-controlled override policy for user theme switching
- explicit contracted module data in tenant responses
- platform-owner administration model based on the existing `PLATFORM_ADMIN` role
- tenant-aware auth payload for the frontend shell
- contextual sidebar and shell driven by real tenant data instead of heuristics
- tenant administration UI for branding, theme and contracted module management

## Access model

The current platform-wide administrator model is now formalized as:

- `PLATFORM_ADMIN` remains the existing role code
- platform-wide administration is only valid when the authenticated user is inside a tenant marked as `platformOwner = true`
- tenant administration endpoints are restricted to platform-owner administrators
- regular tenant users continue to operate through tenant-scoped permissions and contracted modules

This avoids introducing a parallel `SYS_ADMIN` role while still enforcing the business rule that only PhaifferTech should have full platform access.

## Tenant branding model

The tenant model now supports controlled branding fields:

- `logoUrl`
- `primaryColor`
- `accentColor`
- `defaultThemeMode`
- `allowUserThemeOverride`
- `platformOwner`

Branding is intentionally constrained:

- tenant colors are used as accents and highlights
- platform surfaces and structural tokens remain controlled by the design system
- branding does not replace the full token set

## Theme model

The authenticated shell now supports:

- `light`
- `dark`
- `system`

Theme resolution rules:

- if tenant overrides are allowed, the user may store a local preference
- if tenant overrides are disabled, the shell follows the tenant default
- the old shell `styleMode` toggle was removed because it was not a real product setting

## Navigation and visibility model

Sidebar visibility now comes from:

- current tenant identity from auth
- platform admin status from auth
- contracted module availability from `/api/v1/modules`
- permission checks already used by the app

Important effects:

- tenant branding and naming come from real tenant context
- the fake scope selector was removed
- tenant administration navigation is visible only to platform-owner administrators
- regular tenants only see contracted module areas plus tenant-relevant core sections

## Tenant administration flow

The tenant administration screen now makes explicit:

- branding configuration
- default theme mode
- whether users may override the theme
- contracted modules

`CORE_PLATFORM` remains implicitly active for every tenant and is treated as foundational platform access.

## Architectural rationale

This implementation preserves the existing architecture:

- backend rules remain in `core`, not in vertical business modules
- no CRM, Pet or IoT module depends directly on another module
- frontend keeps `app` as routing and uses the existing shared shell/components structure
- no unrelated authenticated areas were redesigned

## Current limitations

- tenant administration still uses the current authenticated module catalog as module options, which is safe for the platform-owner tenant but not yet a dedicated platform catalog endpoint
- module-specific pages are not fully re-themed yet; this iteration focuses on shell and shared foundations
- user management remains tenant-scoped and still uses the existing create/list flow

## Next recommended step

The next low-risk step is to continue productization through dashboard and settings coherence:

- make the global dashboard copy and cards explicitly tenant-aware
- expose tenant branding preview and validation rules in settings/admin flows
- add a dedicated platform module catalog endpoint if tenant contract administration needs to be fully independent from the current tenant availability view
