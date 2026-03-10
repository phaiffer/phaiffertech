import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { Tenant } from '@/shared/types/tenant';
import { TenantThemeMode } from '@/shared/types/auth';

export type TenantUpsertInput = {
  name: string;
  code: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  defaultThemeMode: TenantThemeMode;
  allowUserThemeOverride: boolean;
  contractedModules: string[];
};

export const tenantService = {
  list: (page = 0, size = 20) => apiClient.get<PageResponse<Tenant>>(`/tenants?page=${page}&size=${size}`),
  create: (input: TenantUpsertInput) => apiClient.post<Tenant>('/tenants', input),
  update: (tenantId: string, input: TenantUpsertInput) => apiClient.put<Tenant>(`/tenants/${tenantId}`, input)
};
