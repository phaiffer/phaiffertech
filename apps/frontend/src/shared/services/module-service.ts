import { apiClient } from '@/shared/lib/http';
import { ModuleItem, PlatformDashboardSummary } from '@/shared/types/module';

export const moduleService = {
  list: () => apiClient.get<ModuleItem[]>('/modules'),
  getDashboardSummary: () => apiClient.get<PlatformDashboardSummary>('/dashboard/summary')
};
