import type { CSSProperties } from 'react';
import {
  resolveVisualProfile,
  resolveVisualProfileKey,
  type VisualProfileKey,
  type VisualProfileResolutionInput,
  withAlpha
} from '@/shared/lib/visual-profile';

/* ═══════════════════════════════════════════════════════════════════════════
   PhaifferTech Public Site Visual System
   Unified with the platform design system
   ═══════════════════════════════════════════════════════════════════════════ */

export const sharedShellHeaderClass = 'border-b border-border bg-background/80 backdrop-blur-sm';

export const sharedEyebrowClass = 'text-xs font-semibold uppercase tracking-[0.22em] text-accent';

export const sharedHeroTitleClass =
  'text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl';

export const sharedPageTitleClass =
  'text-3xl font-semibold tracking-tight text-foreground sm:text-4xl';

export const sharedSectionHeadingClass = 'text-base font-semibold tracking-tight text-foreground';

export const sharedCardTitleClass = 'text-lg font-semibold tracking-tight text-foreground';

export const sharedBodyTextClass = 'text-base leading-8 text-muted';

export const sharedSupportingTextClass = 'text-sm leading-6 text-muted sm:text-base sm:leading-7';

export const sharedCompactTextClass = 'text-sm leading-6 text-muted';

export const sharedSurfaceClass = 'rounded-2xl border border-border bg-surface shadow-sm';

export const sharedInteractiveSurfaceClass =
  `${sharedSurfaceClass} transition-all duration-200 hover:border-accent hover:shadow-md`;

export const sharedPanelSurfaceClass = 'rounded-3xl border border-border bg-surface shadow-sm';

export const sharedMutedSurfaceClass = 'rounded-2xl border border-border bg-surface-inset shadow-xs';

export const sharedDashedSurfaceClass =
  'rounded-2xl border border-dashed border-border bg-surface-inset';

export const sharedPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md';

export const sharedSecondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground shadow-xs transition-all duration-200 hover:border-accent hover:bg-accent-muted hover:shadow-sm';

export const sharedCompactButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted shadow-xs transition-colors duration-200 hover:border-accent hover:text-foreground';

export const sharedInputLabelClass =
  'mb-2 block text-sm font-medium tracking-[0.01em] text-foreground';

export const sharedInputClass =
  'w-full rounded-xl border border-border bg-surface-inset px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground focus:border-[color:var(--tenant-accent)] focus:bg-surface focus:ring-2 focus:ring-[color:var(--tenant-accent-soft)] disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-inset disabled:text-muted';

export const publicSiteContainerClass = 'mx-auto w-full max-w-7xl px-6 lg:px-8';

export const publicSectionLayoutClass = 'grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start';

export const publicHeadingColumnClass = 'lg:sticky lg:top-28';

export const publicEyebrowClass = sharedEyebrowClass;

export const publicHeroTitleClass = sharedHeroTitleClass;

export const publicHeroSupportingTextClass = `mt-6 max-w-2xl ${sharedBodyTextClass}`;

export const publicSectionTitleClass =
  `mt-4 ${sharedPageTitleClass}`;

export const publicSectionSupportingTextClass =
  `mt-4 max-w-2xl ${sharedSupportingTextClass}`;

export const publicCardSurfaceClass = sharedSurfaceClass;

export const publicInteractiveCardSurfaceClass = sharedInteractiveSurfaceClass;

export const publicHighlightSurfaceClass =
  'rounded-2xl border border-accent bg-accent-muted shadow-sm';

export const publicChromeSurfaceClass = sharedShellHeaderClass;

export const publicPrimaryButtonClass = sharedPrimaryButtonClass;

export const publicSecondaryButtonClass = sharedSecondaryButtonClass;

export const publicCompactButtonClass = sharedCompactButtonClass;

export type LoginVisualPresetKey = VisualProfileKey;

export type LoginVisualContext = {
  preset: LoginVisualPresetKey;
  containerStyle: CSSProperties;
  cardStyle: CSSProperties;
  brandMarkStyle: CSSProperties;
};

type LoginVisualContextInput = string | VisualProfileResolutionInput | undefined;

function normalizeLoginVisualInput(input?: LoginVisualContextInput): VisualProfileResolutionInput {
  if (typeof input === 'string') {
    return { tenantCode: input };
  }

  return input ?? {};
}

export function resolveLoginVisualPreset(input?: LoginVisualContextInput): LoginVisualPresetKey {
  return resolveVisualProfileKey(normalizeLoginVisualInput(input));
}

export function buildLoginVisualContext(input?: LoginVisualContextInput): LoginVisualContext {
  const visualProfile = resolveVisualProfile(normalizeLoginVisualInput(input));
  const accentSoft = withAlpha(visualProfile.accentColor, visualProfile.accentTone.softAlpha);
  const accentGlow = withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.accentOpacity);
  const primarySoft = withAlpha(visualProfile.primaryColor, visualProfile.surfaceNuance.tintOpacity);
  const supportGlow = withAlpha(visualProfile.primaryColor, visualProfile.loginVisualContext.supportOpacity);

  return {
    preset: visualProfile.key,
    containerStyle: {
      '--tenant-accent': visualProfile.accentColor,
      '--tenant-accent-soft': accentSoft,
      '--tenant-primary-soft': primarySoft,
      backgroundImage: [
        `radial-gradient(circle at ${visualProfile.backgroundMood.accentAnchor}, ${accentGlow}, transparent 34%)`,
        `radial-gradient(circle at ${visualProfile.backgroundMood.supportAnchor}, ${supportGlow}, transparent 30%)`
      ].join(', ')
    } as CSSProperties,
    cardStyle: {
      borderColor: withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.cardBorderOpacity),
      backgroundImage: `linear-gradient(180deg, ${withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.cardTintOpacity)} 0%, transparent 120px)`
    },
    brandMarkStyle: {
      borderColor: withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.cardBorderOpacity),
      backgroundColor: withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.brandMarkOpacity)
    }
  };
}
