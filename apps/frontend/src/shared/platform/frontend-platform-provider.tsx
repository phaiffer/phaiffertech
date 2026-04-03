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
  resolveTenantBranding,
  getTenantWorkspaceLabel,
  toAppThemeMode
} from '@/shared/lib/tenant-branding';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';
import { filterVisibleModuleCatalogItems } from '@/shared/modules/visible-product-modules';
import type { AuthenticatedUser } from '@/shared/types/auth';
import { FrontendPlatformContext } from '@/shared/platform/frontend-platform.context';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';
import type { VisualProfileKey } from '@/shared/lib/visual-profile';

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

function resolveDefaultVisualProfileKey(availableModuleCodes: string[]): VisualProfileKey | null {
  const contractedCodes = availableModuleCodes.filter((code) => code !== 'CORE_PLATFORM');

  if (contractedCodes.length !== 1) {
    return null;
  }

  if (contractedCodes[0] === 'CRM') {
    return 'crm-corporate';
  }

  if (contractedCodes[0] === 'PET') {
    return 'pet-clinic';
  }

  return null;
}

export function FrontendPlatformProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const [themeMode, setThemeMode] = useState<AppThemeMode>('system');
  const { modules: catalogModules, loading, error } = useModuleCatalog();
  const modules = useMemo(
    () => filterVisibleModuleCatalogItems(catalogModules),
    [catalogModules]
  );

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
  const defaultVisualProfile = useMemo(
    () => resolveDefaultVisualProfileKey(availableCodes),
    [availableCodes]
  );

  const value = useMemo<FrontendPlatformState>(() => {
    const isPlatformOwnerTenant = Boolean(user?.platformOwner);
    const hasSystemAdminRole = hasRole(user, 'SYS_ADMIN');
    const canManagePlatformAdministration = Boolean(user?.platformAdmin);
    const resolvedBranding = resolveTenantBranding(user, {
      defaultProfile: defaultVisualProfile
    });

    return {
      user,
      theme: {
        mode: themeMode,
        setMode: setThemeMode,
        tenantDefaultMode,
        canOverride: canOverrideTheme
      },
      branding: {
        logoUrl: resolvedBranding.logoUrl,
        scopeName: resolvedBranding.scopeName,
        tenantCode: resolvedBranding.tenantCode,
        style: resolvedBranding.style
      },
      visualProfile: resolvedBranding.visualProfile,
      workspace: {
        workspaceLabel: getTenantWorkspaceLabel(user),
        accessLabel: user?.impersonation
          ? 'Support impersonation'
          : canManagePlatformAdministration
            ? 'Platform owner workspace'
            : 'Contracted SaaS workspace',
        isPlatformOwnerTenant,
        hasSystemAdminRole,
        hasFullPlatformVisibility: isPlatformOwnerTenant,
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
  }, [
    availableCodes,
    canOverrideTheme,
    contractedProducts,
    defaultVisualProfile,
    error,
    loading,
    modules,
    tenantDefaultMode,
    themeMode,
    user
  ]);

  return <FrontendPlatformContext.Provider value={value}>{children}</FrontendPlatformContext.Provider>;
}
