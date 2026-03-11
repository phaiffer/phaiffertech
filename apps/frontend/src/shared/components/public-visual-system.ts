export const publicSiteContainerClass = 'mx-auto w-full px-6 lg:px-10';

export const publicSectionLayoutClass = 'grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start';

export const publicHeadingColumnClass = 'lg:sticky lg:top-28';

export const publicEyebrowClass = 'text-[length:var(--font-size-xs)] font-bold uppercase tracking-[0.3em] text-[color:var(--tenant-accent)]';

export const publicSectionTitleClass =
  'mt-[var(--space-4)] text-4xl font-extrabold tracking-tight text-[color:var(--foreground)] md:text-5xl';

export const publicSectionSupportingTextClass =
  'mt-[var(--space-6)] max-w-2xl text-[length:var(--font-size-md)] leading-relaxed text-[color:var(--app-shell-muted)]';

export const publicCardSurfaceClass =
  'rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] shadow-card';

export const publicInteractiveCardSurfaceClass =
  `${publicCardSurfaceClass} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_var(--tenant-accent-soft)]`;

export const publicHighlightSurfaceClass =
  'rounded-[var(--radius-xl)] border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] shadow-[0_18px_40px_var(--tenant-accent-soft)]';

export const publicChromeSurfaceClass =
  'border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] shadow-card backdrop-blur-xl';

export const publicPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent)] px-[var(--space-5)] py-[var(--space-3)] text-[length:var(--font-size-sm)] font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)] transition duration-200 hover:shadow-[0_18px_40px_var(--tenant-accent-soft)] active:scale-[0.98]';

export const publicSecondaryButtonClass =
  'inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-5)] py-[var(--space-3)] text-[length:var(--font-size-sm)] font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)] transition duration-200 hover:border-[color:var(--tenant-accent)] hover:shadow-card';
