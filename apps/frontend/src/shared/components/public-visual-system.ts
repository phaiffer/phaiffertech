import type { CSSProperties } from 'react';
import {
  resolveVisualProfile,
  resolveVisualProfileKey,
  type VisualProfileKey,
  type VisualProfileResolutionInput,
  withAlpha
} from '@/shared/lib/visual-profile';

/* ═══════════════════════════════════════════════════════════════════════════
   PetFlow Visual System
   Shared foundation for public, auth, and logged product surfaces
   ═══════════════════════════════════════════════════════════════════════════ */

export const sharedShellHeaderClass =
  'border-b border-slate-200/80 bg-white/92 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.08)] backdrop-blur-sm';

export const sharedEyebrowClass =
  'inline-flex w-fit items-center rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]';

export const sharedHeroTitleClass =
  'text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[4.15rem] lg:leading-[0.98]';

export const sharedPageTitleClass =
  'text-2xl font-bold tracking-[-0.035em] text-slate-900 sm:text-[2rem]';

export const sharedSectionHeadingClass = 'text-lg font-semibold tracking-[-0.02em] text-slate-900';

export const sharedCardTitleClass = 'text-lg font-semibold tracking-[-0.03em] text-foreground';

export const sharedBodyTextClass = 'text-base leading-7 text-slate-700 sm:text-lg sm:leading-8';

export const sharedSupportingTextClass = 'text-sm leading-7 text-slate-700 sm:text-[15px] sm:leading-7';

export const sharedCompactTextClass = 'text-sm leading-6 text-slate-700';

export const sharedSummaryCardClass =
  'rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.99)_140px)] p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)]';

export const sharedSummaryCardLabelClass =
  'text-xs font-semibold uppercase tracking-[0.16em] text-slate-600';

export const sharedReminderSurfaceClass =
  'rounded-2xl border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(248,250,252,0.96)_120px)] p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.1)]';

export const sharedSurfaceClass =
  'rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.98)_120px)] shadow-[0_14px_34px_-28px_rgba(15,23,42,0.16)] [color-scheme:light]';

export const sharedInteractiveSurfaceClass =
  `${sharedSurfaceClass} transition-all duration-200 hover:border-[color:var(--accent)]/25 hover:shadow-[0_18px_38px_-28px_rgba(15,23,42,0.22)]`;

export const sharedPanelSurfaceClass =
  'rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.985)_140px)] shadow-[0_18px_38px_-30px_rgba(15,23,42,0.16)]';

export const sharedMutedSurfaceClass =
  'rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(248,250,252,0.92)_120px)] shadow-[0_12px_28px_-24px_rgba(15,23,42,0.1)]';

export const sharedDashedSurfaceClass =
  'rounded-[1.65rem] border border-dashed border-border bg-surface-inset';

export const sharedPageStackClass = 'space-y-6 xl:space-y-8';

export const sharedPageHeaderClass = 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between';

export const sharedPageHeaderBodyClass = 'max-w-3xl';

export const sharedSectionSurfaceClass =
  'rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.045),rgba(255,255,255,0.99)_140px)] p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.14)] lg:p-6';

export const sharedMutedSectionSurfaceClass =
  'rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(248,250,252,0.94)_120px)] p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.1)] lg:p-5';

export const sharedSectionHeaderClass =
  'mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between';

export const sharedFilterToolbarClass =
  'grid gap-3 rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.035),rgba(255,255,255,0.985)_120px)] p-4 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] xl:gap-4';

export const sharedFieldGroupClass = 'space-y-2';

export const sharedFormActionsClass = 'flex flex-wrap items-center gap-3 pt-1';

export const sharedInlineActionsClass = 'flex flex-wrap items-center gap-2';

export const sharedFieldHintClass = 'text-xs leading-5 text-slate-700';

export const sharedPrimaryButtonClass =
  'ui-primary-button';

export const sharedSecondaryButtonClass =
  'ui-secondary-button';

export const sharedCompactButtonClass =
  'ui-inline-button rounded-full px-3';

export const sharedInputLabelClass =
  'mb-1.5 block text-sm font-semibold tracking-[0.01em] text-slate-900';

export const sharedInputClass =
  'ui-input-control text-sm leading-5 tracking-[0.01em]';

export const sharedInputLeadingAccessoryClass =
  'pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[3.65rem] items-center justify-center text-slate-400';

export const sharedInputTrailingAccessoryClass =
  'pointer-events-none absolute inset-y-0 right-0 z-10 flex min-w-[4.75rem] items-center justify-center px-[1.15rem] text-slate-400';

export const sharedInputWithLeadingAccessoryClass = '[--ui-input-padding-left:3.65rem]';

export const sharedInputWithTrailingAccessoryClass = '[--ui-input-padding-right:4.75rem]';

export const sharedTextareaClass = `${sharedInputClass} min-h-32 resize-y py-3.5`;

export const appShellContentContainerClass = 'mx-auto w-full max-w-[1680px]';

/* ─── Drawer (Slide-out panel) ─────────────────────────────────────────── */

export const sharedDrawerContainerClass =
  'relative h-full w-full max-w-xl overflow-y-auto ui-surface-panel border-l border-border p-6 shadow-[0_32px_72px_-44px_rgba(15,23,42,0.32)] animate-in slide-in-from-right duration-300';

export const sharedDrawerHeaderClass = 'mb-6 flex items-center justify-between'

export const sharedDrawerOverlayClass = 'fixed inset-0 z-50 flex justify-end bg-slate-950/18 backdrop-blur-[2px]';



export const publicSiteContainerClass = 'mx-auto w-full max-w-[1280px] px-6 lg:px-8';

export const publicSectionLayoutClass = 'grid gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-16';

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
  'rounded-[1.75rem] border border-accent/20 bg-accent-muted shadow-card';

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
