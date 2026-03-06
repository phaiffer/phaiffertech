import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { PlatformUser } from '@/shared/types/user';

export type CreateUserInput = {
  email: string;
  fullName: string;
  password: string;
  roleCode?: string;
};

export const userService = {
  list: (page = 0, size = 20) => apiClient.get<PageResponse<PlatformUser>>(`/users?page=${page}&size=${size}`),
  create: (input: CreateUserInput) => apiClient.post<PlatformUser>('/users', input)
};
