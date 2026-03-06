import { apiClient } from '@/shared/lib/http';
import { ModuleItem } from '@/shared/types/module';

export const moduleService = {
  list: () => apiClient.get<ModuleItem[]>('/modules')
};
