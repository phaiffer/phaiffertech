import { TenantThemeMode } from '@/shared/types/auth';

export type Tenant = {
  id: string;
  name: string;
  code: string;
  status: string;
  platformOwner: boolean;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  defaultThemeMode: TenantThemeMode;
  allowUserThemeOverride: boolean;
  trialEndDate?: string | null;
  contractedModules: string[];
  moduleOverrides?: string[];

  planCode?: string;
  featureEntitlements?: string[];
  effectiveFeatureEntitlements?: string[];
};
