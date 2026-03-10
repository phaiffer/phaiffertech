'use client';

import type { ReactNode } from 'react';
import {
  useEffect,
  useMemo,
  useState
} from 'react';
import { useAuth } from '@/shared/auth/use-auth';
import {
  APP_THEME_STORAGE_KEY,
  AppThemeMode,
  buildTenantBrandingStyle,
  getTenantScopeName,
  getTenantWorkspaceLabel,
  toAppThemeMode
} from '@/shared/lib/tenant-branding';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';
import type { AuthenticatedUser } from '@/shared/types/auth';
import { FrontendPlatformContext } from '@/shared/platform/frontend-platform.context';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

function readStoredThemeMode(): AppThemeMode | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedTheme = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
    return storedTheme;
  }

  return null;
}

function hasRole(user: AuthenticatedUser | null | undefined, role: string) {
  if (!user) {
    return false;
  }

  return user.role === role || user.roles?.includes(role) === true;
}

function resolveDocumentTheme(mode: AppThemeMode, prefersDark: boolean) {
  return mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
}

export function FrontendPlatformProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const [themeMode, setThemeMode] = useState<AppThemeMode>('system');
  const { modules, loading, error } = useModuleCatalog();

  const tenantDefaultMode = toAppThemeMode(user?.tenantDefaultThemeMode);
  const canOverrideTheme = user?.tenantAllowUserThemeOverride ?? true;

  useEffect(() => {
    if (!user) {
      setThemeMode('system');
      return;
    }

    const storedThemeMode = readStoredThemeMode();

    if (canOverrideTheme && storedThemeMode) {
      setThemeMode(storedThemeMode);
      return;
    }

    setThemeMode(tenantDefaultMode);
  }, [canOverrideTheme, tenantDefaultMode, user]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : {
          matches: false,
          addEventListener: () => undefined,
          removeEventListener: () => undefined
        };

    const applyTheme = () => {
      root.dataset.theme = resolveDocumentTheme(themeMode, mediaQuery.matches);
    };

    applyTheme();

    if (canOverrideTheme) {
      window.localStorage.setItem(APP_THEME_STORAGE_KEY, themeMode);
    } else {
      window.localStorage.removeItem(APP_THEME_STORAGE_KEY);
    }

    if (themeMode !== 'system') {
      return undefined;
    }

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [canOverrideTheme, themeMode]);

  const availableCodes = useMemo(
    () => modules.filter((moduleItem) => moduleItem.available).map((moduleItem) => moduleItem.code),
    [modules]
  );

  const contractedProducts = useMemo(
    () => modules.filter((moduleItem) => moduleItem.available && moduleItem.code !== 'CORE_PLATFORM'),
    [modules]
  );

  const value = useMemo<FrontendPlatformState>(() => {
    const isPlatformOwnerTenant = Boolean(user?.platformOwner);
    const hasSystemAdminRole = hasRole(user, 'SYS_ADMIN');
    const canManagePlatformAdministration = Boolean(user?.platformAdmin);

    return {
      user,
      theme: {
        mode: themeMode,
        setMode: setThemeMode,
        tenantDefaultMode,
        canOverride: canOverrideTheme
      },
      branding: {
        logoUrl: user?.tenantLogoUrl ?? null,
        scopeName: getTenantScopeName(user),
        tenantCode: user?.tenantCode ?? null,
        style: buildTenantBrandingStyle(user)
      },
      workspace: {
        workspaceLabel: getTenantWorkspaceLabel(user),
        accessLabel: canManagePlatformAdministration ? 'Platform owner tenant' : 'Contracted SaaS workspace',
        isPlatformOwnerTenant,
        hasSystemAdminRole,
        hasFullPlatformVisibility: isPlatformOwnerTenant || hasSystemAdminRole || canManagePlatformAdministration,
        canManagePlatformAdministration
      },
      modules: {
        items: modules,
        loading,
        error,
        availableCodes,
        contractedProducts
      }
    };
  }, [availableCodes, canOverrideTheme, contractedProducts, error, loading, modules, tenantDefaultMode, themeMode, user]);

  return <FrontendPlatformContext.Provider value={value}>{children}</FrontendPlatformContext.Provider>;
}
