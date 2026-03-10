# Public Website Redesign

## What changed

The public-facing area of `apps/frontend` was expanded from a minimal home + login surface into a structured institutional and technical website for PhaifferTech.

New public routes now cover:

- `/`
- `/about`
- `/platform`
- `/products`
- `/engineering`
- `/research`
- `/articles`
- `/articles/[slug]`
- `/contact`
- `/login`

The public layout now uses the shared `PublicSiteShell`, with bilingual navigation, theme toggle and a footer that reflects the current company and platform positioning.

## Why this change was needed

The repository already exposed a much stronger architectural reality than the previous public website communicated.

Before this redesign, the public layer:

- looked too close to a login entry point
- did not explain the modular platform clearly
- did not position PhaifferTech as a serious engineering and applied research brand
- did not help commercial credibility or future technical publication

The redesign was implemented to make the public layer consistent with:

- the real modular platform architecture
- the current product portfolio
- the engineering focus on data, cloud and operational systems
- the academic and applied research direction of the project

## Structure

The implementation preserves the current frontend architecture:

- `src/app/(public)` stays as the routing layer
- `src/modules/website` now owns the composition of public pages
- `src/shared/components` keeps only genuinely reusable public shell components
- `src/shared/public` keeps locale/theme state and shell/login messages

Main files introduced or reorganized:

- `apps/frontend/src/modules/website/website-content.ts`
- `apps/frontend/src/modules/website/website-sections.tsx`
- `apps/frontend/src/modules/website/website-*-page.tsx`
- `apps/frontend/src/app/(public)/**/page.tsx`
- `apps/frontend/src/shared/components/public-site-shell.tsx`

## Architectural rationale

This redesign respects the existing repository rules because:

- it does not touch authenticated business areas outside the public scope
- it keeps public routing thin
- it centralizes public composition in a dedicated module instead of spreading page logic across `app`
- it does not move module business logic into `shared`
- it preserves the current login flow and keeps it separated from the authenticated shell

## Content strategy

The website is now structured to communicate five layers clearly:

1. PhaifferTech as a technology company
2. PhaifferTech Platform as a modular SaaS foundation
3. Product lines across CRM, PetFlow and IoT System
4. Engineering authority in data, cloud and platform architecture
5. Research continuity for technical studies and academic visibility

## Future extension points

The implementation intentionally avoids a CMS at this stage, but it leaves clean extension points for:

- richer article publishing
- MDX/content layer adoption
- future research notes and academic publications
- stronger product evidence and case-study pages

The current article route structure already supports growth without redesigning the public information architecture again.

## Validation

The public website redesign should be validated with:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

These checks confirm that the new public routes, shell and bilingual content remain compatible with the current frontend codebase.
