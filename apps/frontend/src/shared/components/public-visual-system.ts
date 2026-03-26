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

export const sharedShellHeaderClass =
  'border-b border-border/80 bg-background/80 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.35)] backdrop-blur-xl';

export const sharedEyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.24em] text-accent';

export const sharedHeroTitleClass =
  'text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[4.15rem] lg:leading-[0.98]';

export const sharedPageTitleClass =
  'text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.6rem]';

export const sharedSectionHeadingClass = 'text-lg font-semibold tracking-[-0.03em] text-foreground';

export const sharedCardTitleClass = 'text-lg font-semibold tracking-[-0.03em] text-foreground';

export const sharedBodyTextClass = 'text-base leading-7 text-muted sm:text-lg sm:leading-8';

export const sharedSupportingTextClass = 'text-sm leading-6 text-muted sm:text-[15px] sm:leading-7';

export const sharedCompactTextClass = 'text-sm leading-6 text-muted';

export const sharedSurfaceClass = 'rounded-[1.65rem] border border-border bg-surface shadow-sm backdrop-blur-xl';

export const sharedInteractiveSurfaceClass =
  `${sharedSurfaceClass} transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md`;

export const sharedPanelSurfaceClass = 'ui-surface-panel rounded-[1.9rem]';

export const sharedMutedSurfaceClass = 'ui-surface-muted rounded-[1.65rem]';

export const sharedDashedSurfaceClass =
  'rounded-[1.65rem] border border-dashed border-border bg-surface-inset';

export const sharedPageStackClass = 'space-y-6 xl:space-y-8';

export const sharedPageHeaderClass = 'flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between';

export const sharedPageHeaderBodyClass = 'max-w-4xl';

export const sharedSectionSurfaceClass = 'ui-surface-panel rounded-[1.9rem] p-5 lg:p-6';

export const sharedMutedSectionSurfaceClass = 'ui-surface-muted rounded-[1.9rem] p-4 lg:p-5';

export const sharedSectionHeaderClass =
  'mb-5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between';

export const sharedFilterToolbarClass = 'grid gap-3 rounded-[1.9rem] border border-border bg-surface p-4 shadow-sm xl:gap-4';

export const sharedFieldGroupClass = 'space-y-2';

export const sharedFormActionsClass = 'flex flex-wrap items-center gap-3 pt-1';

export const sharedInlineActionsClass = 'flex flex-wrap items-center gap-2';

export const sharedFieldHintClass = 'text-xs leading-5 text-muted';

export const sharedPrimaryButtonClass =
  'ui-primary-button';

export const sharedSecondaryButtonClass =
  'ui-secondary-button';

export const sharedCompactButtonClass =
  'ui-inline-button rounded-full px-3';

export const sharedInputLabelClass =
  'mb-1.5 block text-sm font-medium tracking-[0.01em] text-foreground';

export const sharedInputClass =
  'ui-input-control text-sm leading-5';

export const sharedTextareaClass = `${sharedInputClass} min-h-32 resize-y py-3`;

export const appShellContentContainerClass = 'mx-auto w-full max-w-[1680px]';

/* ─── Drawer (Slide-out panel) ─────────────────────────────────────────── */

export const sharedDrawerContainerClass =
  'relative h-full w-full max-w-xl overflow-y-auto ui-surface-panel border-l border-border p-6 shadow-2xl animate-in slide-in-from-right duration-300';

export const sharedDrawerHeaderClass = 'mb-6 flex items-center justify-between'

export const sharedDrawerOverlayClass = 'fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm';



export const publicSiteContainerClass = 'mx-auto w-full max-w-[1180px] px-6 lg:px-8';

export const publicSectionLayoutClass = 'grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-14';

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
  'rounded-[1.9rem] border border-accent bg-accent-muted shadow-card';

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
