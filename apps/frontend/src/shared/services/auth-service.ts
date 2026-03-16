import { apiClient } from '@/shared/lib/http';
import { AuthTokenResponse, AuthenticatedUser } from '@/shared/types/auth';

export type LoginInput = {
  tenantCode: string;
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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

  refresh: () =>
    apiClient.post<AuthTokenResponse>('/auth/refresh', undefined, { skipAuth: true }),

  logout: () =>
    apiClient.post<void>('/auth/logout'),

  changePassword: (input: ChangePasswordInput) =>
    apiClient.post<void>('/auth/change-password', {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      confirmNewPassword: input.confirmNewPassword
    }),

  me: () => apiClient.get<AuthenticatedUser>('/auth/me')
};
