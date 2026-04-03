import type { DashboardSection, DashboardSummaryCard } from '@/shared/types/dashboard';

export type PetCommercialAccount = {
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
  accountId: string;
};

export type PetCommercialSupportContact = {
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
  accountId?: string;
  accountName?: string;
  supportContactId: string;
};

export type PetCommercialLead = {
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
  accountId?: string;
  supportContactId?: string;
};

export type PetCommercialDeal = {
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
  accountId: string;
  supportContactId?: string;
};

export type PetCommercialPipelineStage = {
  id: string;
  name: string;
  code: string;
  position: number;
  color?: string;
  isDefault: boolean;
};

export type PetCommercialDashboardSummary = {
  totalContacts: number;
  totalLeads: number;
  totalCompanies: number;
  totalDeals: number;
  dealsPorStatus: Record<string, number>;
  tasksPendentes: number;
  overdueTasks: number;
  leadsPorStatus: Record<string, number>;
  summaryCards: DashboardSummaryCard[];
  sections: DashboardSection[];
};
