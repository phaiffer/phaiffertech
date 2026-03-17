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
  contractedModules: string[];

  planCode?: string;
  featureEntitlements?: string[];
};