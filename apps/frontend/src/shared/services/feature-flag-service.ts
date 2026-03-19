import { apiClient } from '@/shared/lib/http';

export type TenantFeatureFlag = {
  key: string;
  enabled: boolean;
  scope: 'GLOBAL' | 'TENANT';
};

export const featureFlagService = {
  listForTenant: (tenantId: string) => apiClient.get<TenantFeatureFlag[]>(`/feature-flags/tenants/${tenantId}`),
  setTenantOverride: (tenantId: string, flagKey: string, enabled: boolean) =>
    apiClient.put<TenantFeatureFlag>(`/feature-flags/tenants/${tenantId}/${flagKey}`, { enabled }),
  clearTenantOverride: (tenantId: string, flagKey: string) =>
    apiClient.delete<void>(`/feature-flags/tenants/${tenantId}/${flagKey}`)
};
