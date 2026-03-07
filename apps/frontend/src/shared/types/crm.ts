import { DashboardSection, DashboardSummaryCard } from '@/shared/types/dashboard';

export type CrmContact = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  company?: string;
  status: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmLead = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  assignedUserId?: string;
  companyId?: string;
  contactId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmCompany = {
  id: string;
  name: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  status: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmPipelineStage = {
  id: string;
  name: string;
  code: string;
  position: number;
  color?: string;
  isDefault: boolean;
};

export type CrmDeal = {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  currency: string;
  status: string;
  companyId: string;
  pipelineStageId: string;
  contactId?: string;
  leadId?: string;
  ownerUserId?: string;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  assignedUserId?: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  relatedType: string;
  relatedId: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmNote = {
  id: string;
  content: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  relatedType: string;
  relatedId: string;
  authorUserId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmActivityItem = {
  id: string;
  eventType: string;
  entity: string;
  entityId: string;
  userId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CrmDashboardSummary = {
  totalContacts: number;
  totalLeads: number;
  totalCompanies: number;
  totalDeals: number;
  dealsPorStatus: Record<string, number>;
  tasksPendentes: number;
  leadsPorStatus: Record<string, number>;
  summaryCards: DashboardSummaryCard[];
  sections: DashboardSection[];
};
