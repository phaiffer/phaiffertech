import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { Tenant } from '@/shared/types/tenant';
import { TenantThemeMode } from '@/shared/types/auth';

export type TenantBaseInput = {
  name: string;
  code: string;
  status?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  defaultThemeMode: TenantThemeMode;
  allowUserThemeOverride: boolean;
  contractedModules: string[];
  planCode?: string;
  featureEntitlements?: string[];
  trialEndDate?: string | null;
};

export type TenantCreateInput = TenantBaseInput & {
  initialAdminFullName: string;
  initialAdminEmail: string;
  temporaryPassword: string;
  requirePasswordChangeOnFirstAccess: boolean;
  trialEndDate: string;
};

export type TenantUpdateInput = TenantBaseInput;

export type TenantFormInput = TenantBaseInput & {
  initialAdminFullName: string;
  initialAdminEmail: string;
  temporaryPassword: string;
  requirePasswordChangeOnFirstAccess: boolean;
  trialEndDate: string;
};

export type TenantUsageMetric = {
  metricKey: string;
  source: string;
  quantity: number;
  unit: string;
  metricDate: string;
  lastRecordedAt: string;
};

export const tenantService = {
  list: (page = 0, size = 20) => apiClient.get<PageResponse<Tenant>>(`/tenants?page=${page}&size=${size}`),
  create: (input: TenantCreateInput) => apiClient.post<Tenant>('/tenants', input),
  update: (tenantId: string, input: TenantUpdateInput) => apiClient.put<Tenant>(`/tenants/${tenantId}`, input),
  listUsageMetrics: (tenantId: string, days = 30, limit = 12) =>
    apiClient.get<TenantUsageMetric[]>(`/tenants/${tenantId}/usage-metrics?days=${days}&limit=${limit}`)
};
