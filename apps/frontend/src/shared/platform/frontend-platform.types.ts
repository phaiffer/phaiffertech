import type { CSSProperties } from 'react';
import type { AppThemeMode } from '@/shared/lib/tenant-branding';
import type { AuthenticatedUser } from '@/shared/types/auth';
import type { ModuleItem } from '@/shared/types/module';

export type FrontendPlatformTheme = {
  mode: AppThemeMode;
  setMode: (mode: AppThemeMode) => void;
  tenantDefaultMode: AppThemeMode;
  canOverride: boolean;
};

export type FrontendPlatformBranding = {
  logoUrl: string | null;
  scopeName: string;
  tenantCode: string | null;
  style: CSSProperties;
};

export type FrontendPlatformWorkspace = {
  workspaceLabel: string;
  accessLabel: string;
  isPlatformOwnerTenant: boolean;
  hasSystemAdminRole: boolean;
  hasFullPlatformVisibility: boolean;
  canManagePlatformAdministration: boolean;
};

export type FrontendPlatformModules = {
  items: ModuleItem[];
  loading: boolean;
  error: string | null;
  availableCodes: string[];
  contractedProducts: ModuleItem[];
};

export type FrontendPlatformState = {
  user: AuthenticatedUser | null;
  theme: FrontendPlatformTheme;
  branding: FrontendPlatformBranding;
  workspace: FrontendPlatformWorkspace;
  modules: FrontendPlatformModules;
};
