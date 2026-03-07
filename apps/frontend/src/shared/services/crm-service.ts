import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import {
  CrmActivityItem,
  CrmCompany,
  CrmContact,
  CrmDashboardSummary,
  CrmDeal,
  CrmLead,
  CrmNote,
  CrmPipelineStage,
  CrmTask
} from '@/shared/types/crm';

export type CreateContactInput = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyId?: string;
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
  companyId?: string;
  contactId?: string;
  notes?: string;
};

export type UpdateLeadInput = CreateLeadInput & {
  status: string;
};

export type CreateCompanyInput = {
  name: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  status?: string;
  ownerUserId?: string;
};

export type UpdateCompanyInput = CreateCompanyInput & {
  status: string;
};

export type CreatePipelineStageInput = {
  name: string;
  code?: string;
  position: number;
  color?: string;
  isDefault?: boolean;
};

export type UpdatePipelineStageInput = CreatePipelineStageInput;

export type CreateDealInput = {
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: string;
  companyId: string;
  pipelineStageId: string;
  contactId?: string;
  leadId?: string;
  ownerUserId?: string;
  expectedCloseDate?: string;
};

export type UpdateDealInput = CreateDealInput & {
  status: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  assignedUserId?: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
};

export type UpdateTaskInput = CreateTaskInput & {
  status: string;
};

export type CreateNoteInput = {
  content: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
};

export type UpdateNoteInput = CreateNoteInput;

type QueryValue = string | number | undefined | null;

type ContactFilters = {
  status?: string;
  companyId?: string;
  ownerUserId?: string;
};

type LeadFilters = {
  status?: string;
  source?: string;
  companyId?: string;
  contactId?: string;
  assignedUserId?: string;
};

type CompanyFilters = {
  status?: string;
  ownerUserId?: string;
};

type DealFilters = {
  status?: string;
  companyId?: string;
  pipelineStageId?: string;
  ownerUserId?: string;
};

type TaskFilters = {
  status?: string;
  priority?: string;
  assignedUserId?: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
};

type NoteFilters = {
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
};

function queryString(
  page = 0,
  size = 20,
  search = '',
  filters: Record<string, QueryValue> = {}
) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (search.trim()) {
    params.set('search', search.trim());
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    const normalized = String(value).trim();
    if (!normalized) {
      return;
    }
    params.set(key, normalized);
  });
  return params.toString();
}

export const crmService = {
  listContacts: (page = 0, size = 20, search = '', filters: ContactFilters = {}) =>
    apiClient.get<PageResponse<CrmContact>>(
      `/crm/contacts?${queryString(page, size, search, {
        status: filters.status,
        companyId: filters.companyId,
        ownerUserId: filters.ownerUserId
      })}`
    ),

  getContact: (id: string) => apiClient.get<CrmContact>(`/crm/contacts/${id}`),

  createContact: (input: CreateContactInput) => apiClient.post<CrmContact>('/crm/contacts', input),

  updateContact: (id: string, input: UpdateContactInput) =>
    apiClient.put<CrmContact>(`/crm/contacts/${id}`, input),

  deleteContact: (id: string) => apiClient.delete<void>(`/crm/contacts/${id}`),

  listLeads: (page = 0, size = 20, search = '', filters: LeadFilters = {}) =>
    apiClient.get<PageResponse<CrmLead>>(
      `/crm/leads?${queryString(page, size, search, {
        status: filters.status,
        source: filters.source,
        companyId: filters.companyId,
        contactId: filters.contactId,
        assignedUserId: filters.assignedUserId
      })}`
    ),

  getLead: (id: string) => apiClient.get<CrmLead>(`/crm/leads/${id}`),

  createLead: (input: CreateLeadInput) => apiClient.post<CrmLead>('/crm/leads', input),

  updateLead: (id: string, input: UpdateLeadInput) =>
    apiClient.put<CrmLead>(`/crm/leads/${id}`, input),

  deleteLead: (id: string) => apiClient.delete<void>(`/crm/leads/${id}`),

  listCompanies: (page = 0, size = 20, search = '', filters: CompanyFilters = {}) =>
    apiClient.get<PageResponse<CrmCompany>>(
      `/crm/companies?${queryString(page, size, search, {
        status: filters.status,
        ownerUserId: filters.ownerUserId
      })}`
    ),

  getCompany: (id: string) => apiClient.get<CrmCompany>(`/crm/companies/${id}`),

  createCompany: (input: CreateCompanyInput) => apiClient.post<CrmCompany>('/crm/companies', input),

  updateCompany: (id: string, input: UpdateCompanyInput) =>
    apiClient.put<CrmCompany>(`/crm/companies/${id}`, input),

  deleteCompany: (id: string) => apiClient.delete<void>(`/crm/companies/${id}`),

  listPipelineStages: (page = 0, size = 20, search = '') =>
    apiClient.get<PageResponse<CrmPipelineStage>>(`/crm/pipeline-stages?${queryString(page, size, search)}`),

  getPipelineStage: (id: string) => apiClient.get<CrmPipelineStage>(`/crm/pipeline-stages/${id}`),

  createPipelineStage: (input: CreatePipelineStageInput) =>
    apiClient.post<CrmPipelineStage>('/crm/pipeline-stages', input),

  updatePipelineStage: (id: string, input: UpdatePipelineStageInput) =>
    apiClient.put<CrmPipelineStage>(`/crm/pipeline-stages/${id}`, input),

  deletePipelineStage: (id: string) => apiClient.delete<void>(`/crm/pipeline-stages/${id}`),

  listDeals: (page = 0, size = 20, search = '', filters: DealFilters = {}) =>
    apiClient.get<PageResponse<CrmDeal>>(
      `/crm/deals?${queryString(page, size, search, {
        status: filters.status,
        companyId: filters.companyId,
        pipelineStageId: filters.pipelineStageId,
        ownerUserId: filters.ownerUserId
      })}`
    ),

  getDeal: (id: string) => apiClient.get<CrmDeal>(`/crm/deals/${id}`),

  createDeal: (input: CreateDealInput) => apiClient.post<CrmDeal>('/crm/deals', input),

  updateDeal: (id: string, input: UpdateDealInput) => apiClient.put<CrmDeal>(`/crm/deals/${id}`, input),

  deleteDeal: (id: string) => apiClient.delete<void>(`/crm/deals/${id}`),

  listTasks: (page = 0, size = 20, search = '', filters: TaskFilters = {}) =>
    apiClient.get<PageResponse<CrmTask>>(
      `/crm/tasks?${queryString(page, size, search, {
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        companyId: filters.companyId,
        contactId: filters.contactId,
        leadId: filters.leadId,
        dealId: filters.dealId
      })}`
    ),

  getTask: (id: string) => apiClient.get<CrmTask>(`/crm/tasks/${id}`),

  createTask: (input: CreateTaskInput) => apiClient.post<CrmTask>('/crm/tasks', input),

  updateTask: (id: string, input: UpdateTaskInput) => apiClient.put<CrmTask>(`/crm/tasks/${id}`, input),

  deleteTask: (id: string) => apiClient.delete<void>(`/crm/tasks/${id}`),

  listNotes: (page = 0, size = 20, search = '', filters: NoteFilters = {}) =>
    apiClient.get<PageResponse<CrmNote>>(
      `/crm/notes?${queryString(page, size, search, {
        companyId: filters.companyId,
        contactId: filters.contactId,
        leadId: filters.leadId,
        dealId: filters.dealId
      })}`
    ),

  getNote: (id: string) => apiClient.get<CrmNote>(`/crm/notes/${id}`),

  createNote: (input: CreateNoteInput) => apiClient.post<CrmNote>('/crm/notes', input),

  updateNote: (id: string, input: UpdateNoteInput) => apiClient.put<CrmNote>(`/crm/notes/${id}`, input),

  deleteNote: (id: string) => apiClient.delete<void>(`/crm/notes/${id}`),

  listActivity: (page = 0, size = 20) =>
    apiClient.get<PageResponse<CrmActivityItem>>(`/crm/activity?${queryString(page, size)}`),

  getDashboardSummary: () => apiClient.get<CrmDashboardSummary>('/crm/dashboard/summary')
};
