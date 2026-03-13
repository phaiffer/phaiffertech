import { apiClient } from '@/shared/lib/http';
import { AuthTokenResponse, AuthenticatedUser } from '@/shared/types/auth';

export type LoginInput = {
  tenantCode: string;
  email: string;
  password: string;
};

export const authService = {
  login: (input: LoginInput) =>
    apiClient.post<AuthTokenResponse>('/auth/login', {
      tenantCode: input.tenantCode,
      email: input.email,
      password: input.password
    }, { skipAuth: true }),

  demoLogin: () =>
    apiClient.post<AuthTokenResponse>('/auth/demo-login', undefined, { skipAuth: true }),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokenResponse>('/auth/refresh', { refreshToken }, { skipAuth: true }),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refreshToken }),

  me: () => apiClient.get<AuthenticatedUser>('/auth/me')
};
