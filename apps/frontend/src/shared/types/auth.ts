export type TenantThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';

export type SupportImpersonationContext = {
  sessionId: string;
  sourceTenantId: string;
  sourceTenantName: string;
  sourceTenantCode: string;
  startedAt: string;
  expiresAt: string;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantLogoUrl?: string | null;
  tenantPrimaryColor?: string | null;
  tenantAccentColor?: string | null;
  tenantDefaultThemeMode: TenantThemeMode;
  tenantAllowUserThemeOverride: boolean;
  platformOwner: boolean;
  platformAdmin: boolean;
  role: string;
  roles?: string[];
  permissions: string[];
  featureEntitlements?: string[];
  impersonation?: SupportImpersonationContext | null;
};

export type AuthTokenResponse = {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthenticatedUser;
};

export type SessionState = {
  accessToken: string;
  user: AuthenticatedUser;
};
