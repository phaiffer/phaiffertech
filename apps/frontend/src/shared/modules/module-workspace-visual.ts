import type { CSSProperties } from 'react';
import { resolveVisualProfile, type VisualProfileKey, type VisualProfileModuleContext, withAlpha } from '@/shared/lib/visual-profile';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

export type ModuleWorkspaceVisualState = {
  visualProfile: FrontendPlatformState['visualProfile'];
  style: CSSProperties;
};

type PlatformVisualInput = Pick<FrontendPlatformState, 'branding' | 'user' | 'visualProfile'>;

type ModuleWorkspaceVisualInput = {
  moduleContext: VisualProfileModuleContext;
  defaultProfile: VisualProfileKey;
};

export const workspacePanelSurfaceStyle: CSSProperties = {
  borderColor: 'var(--workspace-panel-border)',
  boxShadow: 'var(--workspace-panel-shadow)',
  backgroundImage: [
    'linear-gradient(180deg, var(--workspace-panel-tint) 0%, transparent 180px)',
    'radial-gradient(circle at top right, var(--workspace-panel-support), transparent 50%)'
  ].join(', ')
};

export const workspaceMutedSurfaceStyle: CSSProperties = {
  borderColor: 'var(--workspace-panel-border)',
  boxShadow: 'var(--workspace-muted-shadow)',
  backgroundImage: [
    'linear-gradient(180deg, var(--workspace-panel-muted-tint) 0%, transparent 160px)',
    'radial-gradient(circle at bottom right, var(--workspace-panel-muted-support), transparent 55%)'
  ].join(', ')
};

export const workspaceDashedSurfaceStyle: CSSProperties = {
  borderColor: 'var(--workspace-panel-border)',
  backgroundImage: 'linear-gradient(180deg, var(--workspace-panel-muted-tint) 0%, transparent 160px)'
};

export function resolveModuleWorkspaceVisualState(
  platform: PlatformVisualInput,
  input: ModuleWorkspaceVisualInput
): ModuleWorkspaceVisualState {
  const visualProfile = resolveVisualProfile({
    tenantCode: platform.branding.tenantCode,
    moduleContext: input.moduleContext,
    defaultProfile: input.defaultProfile,
    accentColor: platform.user?.tenantAccentColor ?? platform.visualProfile.accentColor,
    primaryColor: platform.user?.tenantPrimaryColor ?? platform.visualProfile.primaryColor
  });

  const panelTint = withAlpha(visualProfile.accentColor, visualProfile.dashboardHighlightTone.accentOpacity);
  const panelSupport = withAlpha(visualProfile.primaryColor, visualProfile.dashboardHighlightTone.supportOpacity);
  const mutedTint = withAlpha(
    visualProfile.accentColor,
    Math.max(visualProfile.dashboardHighlightTone.accentOpacity - 0.04, 0.04)
  );
  const mutedSupport = withAlpha(
    visualProfile.primaryColor,
    Math.max(visualProfile.dashboardHighlightTone.supportOpacity - 0.03, 0.03)
  );
  const borderColor = withAlpha(visualProfile.accentColor, visualProfile.surfaceNuance.borderOpacity);
  const shadowStrength = visualProfile.surfaceNuance.elevation === 'soft' ? 0.22 : 0.18;
  const mutedShadowStrength = visualProfile.surfaceNuance.elevation === 'soft' ? 0.15 : 0.11;

  return {
    visualProfile,
    style: {
      '--tenant-primary': visualProfile.primaryColor,
      '--tenant-primary-soft': withAlpha(
        visualProfile.primaryColor,
        visualProfile.surfaceNuance.tintOpacity
      ),
      '--tenant-accent': visualProfile.accentColor,
      '--tenant-accent-soft': withAlpha(
        visualProfile.accentColor,
        visualProfile.accentTone.softAlpha
      ),
      '--workspace-panel-border': borderColor,
      '--workspace-panel-tint': panelTint,
      '--workspace-panel-support': panelSupport,
      '--workspace-panel-muted-tint': mutedTint,
      '--workspace-panel-muted-support': mutedSupport,
      '--workspace-panel-shadow': `0 18px 36px -28px ${withAlpha(visualProfile.primaryColor, shadowStrength)}`,
      '--workspace-muted-shadow': `0 14px 28px -24px ${withAlpha(visualProfile.primaryColor, mutedShadowStrength)}`
    } as CSSProperties
  };
}
