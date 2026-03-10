import { CSSProperties } from 'react';
import { AuthenticatedUser, TenantThemeMode } from '@/shared/types/auth';

export type AppThemeMode = 'light' | 'dark' | 'system';

const FALLBACK_PRIMARY = '#0f172a';
const FALLBACK_ACCENT = '#2563eb';

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

export function buildTenantBrandingStyle(user?: AuthenticatedUser | null): CSSProperties {
  const primary = user?.tenantPrimaryColor ?? FALLBACK_PRIMARY;
  const accent = user?.tenantAccentColor ?? FALLBACK_ACCENT;

  return {
    '--tenant-primary': primary,
    '--tenant-primary-soft': withAlpha(primary, 0.16),
    '--tenant-accent': accent,
    '--tenant-accent-soft': withAlpha(accent, 0.18)
  } as CSSProperties;
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

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
