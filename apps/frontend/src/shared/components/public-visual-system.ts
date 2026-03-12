/* ═══════════════════════════════════════════════════════════════════════════
   PhaifferTech Public Site Visual System
   Unified with the platform design system
   ═══════════════════════════════════════════════════════════════════════════ */

export const publicSiteContainerClass = 'mx-auto w-full max-w-7xl px-6 lg:px-8';

export const publicSectionLayoutClass = 'grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start';

export const publicHeadingColumnClass = 'lg:sticky lg:top-28';

export const publicEyebrowClass = 'text-xs font-medium uppercase tracking-wider text-accent';

export const publicSectionTitleClass =
  'mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl';

export const publicSectionSupportingTextClass =
  'mt-4 max-w-2xl text-base leading-relaxed text-muted';

export const publicCardSurfaceClass =
  'rounded-xl border border-border bg-surface';

export const publicInteractiveCardSurfaceClass =
  `${publicCardSurfaceClass} transition-all duration-200 hover:border-accent hover:shadow-md`;

export const publicHighlightSurfaceClass =
  'rounded-xl border border-accent bg-accent-muted';

export const publicChromeSurfaceClass =
  'border border-border bg-surface/80 backdrop-blur-sm';

export const publicPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90';

export const publicSecondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-accent-muted';
