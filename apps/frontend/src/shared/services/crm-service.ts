import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { CrmContact, CrmLead } from '@/shared/types/crm';

export type CreateContactInput = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  ownerUserId?: string;
};

export type UpdateContactInput = CreateContactInput & {
  status: string;
};

export type CreateLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  assignedUserId?: string;
};

export type UpdateLeadInput = CreateLeadInput & {
  status: string;
};

function queryString(page = 0, size = 20, search = '') {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (search.trim()) {
    params.set('search', search.trim());
  }
  return params.toString();
}

export const crmService = {
  listContacts: (page = 0, size = 20, search = '') =>
    apiClient.get<PageResponse<CrmContact>>(`/crm/contacts?${queryString(page, size, search)}`),

  createContact: (input: CreateContactInput) => apiClient.post<CrmContact>('/crm/contacts', input),

  updateContact: (id: string, input: UpdateContactInput) =>
    apiClient.put<CrmContact>(`/crm/contacts/${id}`, input),

  deleteContact: (id: string) => apiClient.delete<void>(`/crm/contacts/${id}`),

  listLeads: (page = 0, size = 20, search = '') =>
    apiClient.get<PageResponse<CrmLead>>(`/crm/leads?${queryString(page, size, search)}`),

  createLead: (input: CreateLeadInput) => apiClient.post<CrmLead>('/crm/leads', input),

  updateLead: (id: string, input: UpdateLeadInput) =>
    apiClient.put<CrmLead>(`/crm/leads/${id}`, input),

  deleteLead: (id: string) => apiClient.delete<void>(`/crm/leads/${id}`)
};
