import type { CSSProperties } from 'react';
import {
  resolveVisualProfile,
  resolveVisualProfileKey,
  type VisualProfileKey,
  type VisualProfileResolutionInput,
  withAlpha
} from '@/shared/lib/visual-profile';

/* ═══════════════════════════════════════════════════════════════════════════
   Pet Visual System
   Shared foundation for public, auth, and logged product surfaces
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Public website (out of the Comanda v2 scope): frozen legacy values ─── */

const legacyShellHeaderClass =
  'border-b border-slate-200/80 bg-white/92 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.08)] backdrop-blur-sm';

const legacyEyebrowClass =
  'inline-flex w-fit items-center rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]';

const legacyPageTitleClass =
  'text-2xl font-bold tracking-[-0.035em] text-slate-900 sm:text-[2rem]';

const legacySupportingTextClass = 'text-sm leading-7 text-slate-700 sm:text-[15px] sm:leading-7';

const legacySurfaceClass =
  'rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.98)_120px)] shadow-[0_14px_34px_-28px_rgba(15,23,42,0.16)] [color-scheme:light]';

const legacyInteractiveSurfaceClass =
  `${legacySurfaceClass} transition-all duration-200 hover:border-[color:var(--accent)]/25 hover:shadow-[0_18px_38px_-28px_rgba(15,23,42,0.22)]`;

/* ─── App surfaces (Comanda v2): flat, 1px borders, 6px radius, no shadow ─── */

export const sharedShellHeaderClass = 'border-b border-slate-200 bg-white';

// v2 has no eyebrows: kept as plain metadata text for the few callers that still pass one.
export const sharedEyebrowClass = 'text-xs font-medium text-slate-600';

export const sharedHeroTitleClass =
  'text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[4.15rem] lg:leading-[0.98]';

// Page title 20px/600, section title 14px/600.
export const sharedPageTitleClass = 'text-xl font-semibold text-slate-900';

export const sharedSectionHeadingClass = 'text-sm font-semibold text-slate-900';

export const sharedCardTitleClass = 'text-sm font-semibold text-foreground';

// Also used by the public hero: keep unchanged.
export const sharedBodyTextClass = 'text-base leading-7 text-slate-700 sm:text-lg sm:leading-8';

export const sharedSupportingTextClass = 'text-sm leading-6 text-slate-600';

// Also used by the public hero: keep unchanged.
export const sharedCompactTextClass = 'text-sm leading-6 text-slate-800';

export const sharedSummaryCardClass = 'rounded-md border border-slate-200 bg-white p-4';

export const sharedSummaryCardLabelClass = 'text-xs font-medium text-slate-600';

export const sharedReminderSurfaceClass = 'rounded-md border border-slate-200 bg-slate-50 p-4';

export const sharedSurfaceClass = 'rounded-md border border-slate-200 bg-white';

export const sharedInteractiveSurfaceClass =
  `${sharedSurfaceClass} transition-colors duration-150 hover:border-slate-300`;

export const sharedPanelSurfaceClass = 'rounded-md border border-slate-200 bg-white';

export const sharedMutedSurfaceClass = 'rounded-md border border-slate-200 bg-slate-50';

export const sharedDashedSurfaceClass = 'rounded-md border border-dashed border-slate-300 bg-slate-50';

export const sharedPageStackClass = 'space-y-5';

export const sharedPageHeaderClass = 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between';

export const sharedPageHeaderBodyClass = 'min-w-0 max-w-3xl';

export const sharedSectionSurfaceClass = 'rounded-md border border-slate-200 bg-white p-4';

export const sharedMutedSectionSurfaceClass = 'rounded-md border border-slate-200 bg-slate-50 p-4';

export const sharedSectionHeaderClass =
  'mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between';

export const sharedFilterToolbarClass = 'grid gap-3 rounded-md border border-slate-200 bg-white p-3';

export const sharedFieldGroupClass = 'space-y-1';

export const sharedFormActionsClass = 'flex flex-wrap items-center gap-2 pt-1';

export const sharedInlineActionsClass = 'flex flex-wrap items-center gap-2';

export const sharedFieldHintClass = 'text-xs leading-5 text-slate-600';

export const sharedPrimaryButtonClass =
  'ui-primary-button';

export const sharedSecondaryButtonClass =
  'ui-secondary-button';

export const sharedCompactButtonClass = 'ui-inline-button';

export const sharedInputLabelClass = 'mb-1 block text-[13px] font-medium text-slate-700';

export const sharedInputClass = 'ui-input-control';

export const sharedInputLeadingAccessoryClass =
  'pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center text-slate-500';

export const sharedInputTrailingAccessoryClass =
  'pointer-events-none absolute inset-y-0 right-0 z-10 flex min-w-[3rem] items-center justify-center px-3 text-slate-500';

export const sharedInputWithLeadingAccessoryClass = '[--ui-input-padding-left:2.25rem]';

export const sharedInputWithTrailingAccessoryClass = '[--ui-input-padding-right:3rem]';

export const sharedTextareaClass = `${sharedInputClass} min-h-24 resize-y py-2`;

export const appShellContentContainerClass = 'mx-auto w-full max-w-[1680px]';

/* ─── Drawer (Slide-out panel) ─────────────────────────────────────────── */

export const sharedDrawerContainerClass =
  'relative h-full w-full max-w-xl overflow-y-auto ui-surface-panel border-l border-border p-5 animate-in slide-in-from-right duration-200';

export const sharedDrawerHeaderClass = 'mb-5 flex items-center justify-between';

export const sharedDrawerOverlayClass = 'fixed inset-0 z-50 flex justify-end bg-slate-950/30';

export const publicSiteContainerClass = 'mx-auto w-full max-w-[1280px] px-6 lg:px-8';

export const publicSectionLayoutClass = 'grid gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-16';

export const publicHeadingColumnClass = 'lg:sticky lg:top-28';

export const publicEyebrowClass = legacyEyebrowClass;

export const publicHeroTitleClass = sharedHeroTitleClass;

export const publicHeroSupportingTextClass = `mt-6 max-w-2xl ${sharedBodyTextClass}`;

export const publicSectionTitleClass =
  `mt-4 ${legacyPageTitleClass}`;

export const publicSectionSupportingTextClass =
  `mt-4 max-w-2xl ${legacySupportingTextClass}`;

export const publicCardSurfaceClass = legacySurfaceClass;

export const publicInteractiveCardSurfaceClass = legacyInteractiveSurfaceClass;

export const publicHighlightSurfaceClass =
  'rounded-[1.75rem] border border-accent/20 bg-accent-muted shadow-card';

export const publicChromeSurfaceClass = legacyShellHeaderClass;

export const publicPrimaryButtonClass = sharedPrimaryButtonClass;

export const publicSecondaryButtonClass = sharedSecondaryButtonClass;

export const publicCompactButtonClass = 'ui-inline-button rounded-full px-3';

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
    return {
      tenantCode: input,
      defaultProfile: 'pet-grooming'
    };
  }

  return {
    defaultProfile: 'pet-grooming',
    ...(input ?? {})
  };
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
        `radial-gradient(circle at ${visualProfile.backgroundMood.supportAnchor}, ${supportGlow}, transparent 32%)`,
        'linear-gradient(180deg, rgba(255, 255, 255, 0.86), transparent 280px)'
      ].join(', ')
    } as CSSProperties,
    cardStyle: {
      borderColor: withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.cardBorderOpacity),
      backgroundImage: [
        `linear-gradient(180deg, ${withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.cardTintOpacity)} 0%, transparent 160px)`,
        `radial-gradient(circle at top right, ${withAlpha(visualProfile.primaryColor, visualProfile.loginVisualContext.supportOpacity)} 0%, transparent 52%)`
      ].join(', ')
    },
    brandMarkStyle: {
      borderColor: withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.cardBorderOpacity),
      backgroundColor: withAlpha(visualProfile.accentColor, visualProfile.loginVisualContext.brandMarkOpacity)
    }
  };
}
