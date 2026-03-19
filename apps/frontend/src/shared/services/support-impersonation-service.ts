import { apiClient } from '@/shared/lib/http';
import { AuthTokenResponse } from '@/shared/types/auth';

export type StartSupportImpersonationInput = {
  targetTenantId: string;
  reason: string;
  durationMinutes?: number;
};

export const supportImpersonationService = {
  start: (input: StartSupportImpersonationInput) =>
    apiClient.post<AuthTokenResponse>('/auth/impersonation/start', {
      targetTenantId: input.targetTenantId,
      reason: input.reason,
      durationMinutes: input.durationMinutes
    }),

  stop: () =>
    apiClient.post<AuthTokenResponse>('/auth/impersonation/stop')
};
