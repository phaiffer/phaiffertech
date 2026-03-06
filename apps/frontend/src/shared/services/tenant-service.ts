import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { Tenant } from '@/shared/types/tenant';

export const tenantService = {
  list: (page = 0, size = 20) => apiClient.get<PageResponse<Tenant>>(`/tenants?page=${page}&size=${size}`)
};
