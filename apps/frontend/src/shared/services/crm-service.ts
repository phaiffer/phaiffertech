import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { CrmContact } from '@/shared/types/crm';

export type CreateContactInput = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export const crmService = {
  listContacts: (page = 0, size = 20) =>
    apiClient.get<PageResponse<CrmContact>>(`/crm/contacts?page=${page}&size=${size}`),
  createContact: (input: CreateContactInput) => apiClient.post<CrmContact>('/crm/contacts', input)
};
