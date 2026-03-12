import { CSSProperties } from 'react';
import { AuthenticatedUser, TenantThemeMode } from '@/shared/types/auth';
import {
  resolveUserVisualProfile,
  type VisualProfile,
  type VisualProfileKey,
  type VisualProfileModuleContext,
  withAlpha
} from '@/shared/lib/visual-profile';

export type AppThemeMode = 'light' | 'dark' | 'system';

export const APP_THEME_STORAGE_KEY = 'app-shell-theme';
export const APP_THEME_OPTIONS: AppThemeMode[] = ['dark', 'light', 'system'];

export function toAppThemeMode(themeMode?: TenantThemeMode | AppThemeMode | null): AppThemeMode {
  if (!themeMode) {
    return 'system';
  }

  const normalized = themeMode.toString().toLowerCase();
  if (normalized === 'light' || normalized === 'dark' || normalized === 'system') {
    return normalized;
  }

  return 'system';
}

export type ResolvedTenantBranding = {
  logoUrl: string | null;
  scopeName: string;
  tenantCode: string | null;
  style: CSSProperties;
  visualProfile: VisualProfile;
};

export function buildTenantBrandingStyle(
  user?: AuthenticatedUser | null,
  visualProfile?: VisualProfile
): CSSProperties {
  const resolvedVisualProfile = visualProfile ?? resolveUserVisualProfile(user);
  const primary = user?.tenantPrimaryColor ?? resolvedVisualProfile.primaryColor;
  const accent = user?.tenantAccentColor ?? resolvedVisualProfile.accentColor;

  return {
    '--tenant-primary': primary,
    '--tenant-primary-soft': withAlpha(primary, resolvedVisualProfile.surfaceNuance.tintOpacity),
    '--tenant-accent': accent,
    '--tenant-accent-soft': withAlpha(accent, resolvedVisualProfile.accentTone.softAlpha)
  } as CSSProperties;
}

export function resolveTenantBranding(
  user?: AuthenticatedUser | null,
  options: {
    moduleContext?: VisualProfileModuleContext | null;
    defaultProfile?: VisualProfileKey | null;
  } = {}
): ResolvedTenantBranding {
  const visualProfile = resolveUserVisualProfile(user, options);

  return {
    logoUrl: user?.tenantLogoUrl ?? null,
    scopeName: getTenantScopeName(user),
    tenantCode: user?.tenantCode ?? null,
    style: buildTenantBrandingStyle(user, visualProfile),
    visualProfile
  };
}

export function getAppThemeModeLabel(mode: AppThemeMode) {
  if (mode === 'light') {
    return 'Light';
  }

  if (mode === 'dark') {
    return 'Dark';
  }

  return 'System';
}

export function getTenantWorkspaceLabel(user?: AuthenticatedUser | null) {
  if (!user) {
    return 'Platform workspace';
  }

  return user.platformAdmin ? 'Platform control plane' : 'Tenant workspace';
}

export function getTenantScopeName(user?: AuthenticatedUser | null) {
  if (!user) {
    return 'PhaifferTech Platform';
  }

  return user.tenantName;
}
