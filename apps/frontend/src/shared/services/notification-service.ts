import { apiClient } from '@/shared/lib/http';
import { NotificationSummary } from '@/shared/types/notification';

export const notificationService = {
  getSummary: () => apiClient.get<NotificationSummary>('/notifications/summary')
};
