import type { PageResponse } from '@/shared/types/common';
import { crmService } from '@/shared/services/crm-service';
import type {
  PetCommercialAccount,
  PetCommercialDashboardSummary,
  PetCommercialDeal,
  PetCommercialLead,
  PetCommercialPipelineStage,
  PetCommercialSupportContact
} from '@/shared/types/pet-commercial';

export type PetCommercialAccountFilters = {
  status?: string;
  ownerUserId?: string;
};

export type PetCommercialSupportContactFilters = {
  status?: string;
  accountId?: string;
  companyId?: string;
  ownerUserId?: string;
};

export type PetCommercialLeadFilters = {
  status?: string;
  source?: string;
  accountId?: string;
  companyId?: string;
  supportContactId?: string;
  contactId?: string;
  assignedUserId?: string;
};

export type PetCommercialDealFilters = {
  status?: string;
  accountId?: string;
  companyId?: string;
  pipelineStageId?: string;
  ownerUserId?: string;
};

export type CreatePetCommercialLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  assignedUserId?: string;
  accountId?: string;
  companyId?: string;
  supportContactId?: string;
  contactId?: string;
  notes?: string;
};

export type UpdatePetCommercialLeadInput = CreatePetCommercialLeadInput & {
  status: string;
};

export type CreatePetCommercialDealInput = {
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: string;
  accountId?: string;
  companyId?: string;
  pipelineStageId: string;
  supportContactId?: string;
  contactId?: string;
  leadId?: string;
  ownerUserId?: string;
  expectedCloseDate?: string;
};

export type UpdatePetCommercialDealInput = CreatePetCommercialDealInput & {
  status: string;
};

export type CreatePetCommercialPipelineStageInput = {
  name: string;
  code?: string;
  position: number;
  color?: string;
  isDefault?: boolean;
};

export type UpdatePetCommercialPipelineStageInput = CreatePetCommercialPipelineStageInput;

function resolveLegacyAccountId(value?: { accountId?: string; companyId?: string }) {
  return value?.accountId ?? value?.companyId;
}

function resolveRequiredLegacyAccountId(value?: { accountId?: string; companyId?: string }) {
  const accountId = resolveLegacyAccountId(value);
  if (!accountId) {
    throw new Error('PetFlow commercial deals require an account identifier.');
  }
  return accountId;
}

function resolveLegacySupportContactId(value?: { supportContactId?: string; contactId?: string }) {
  return value?.supportContactId ?? value?.contactId;
}

function mapPageResponse<Legacy, Current>(
  page: PageResponse<Legacy>,
  mapItem: (item: Legacy) => Current
): PageResponse<Current> {
  return {
    ...page,
    items: page.items?.map(mapItem),
    content: page.content?.map(mapItem)
  };
}

function mapPipelineStage(stage: PetCommercialPipelineStage): PetCommercialPipelineStage {
  return {
    ...stage
  };
}

function mapDashboardSummary(summary: PetCommercialDashboardSummary): PetCommercialDashboardSummary {
  return {
    ...summary,
    summaryCards: [...summary.summaryCards],
    sections: [...summary.sections]
  };
}

function mapAccount(account: {
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
}): PetCommercialAccount {
  return {
    ...account,
    accountId: account.id
  };
}

function mapSupportContact(contact: {
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
}): PetCommercialSupportContact {
  return {
    ...contact,
    supportContactId: contact.id,
    accountId: contact.companyId,
    accountName: contact.company
  };
}

function mapLead(lead: {
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
}): PetCommercialLead {
  return {
    ...lead,
    accountId: lead.companyId,
    supportContactId: lead.contactId
  };
}

function mapDeal(deal: {
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
}): PetCommercialDeal {
  return {
    ...deal,
    accountId: deal.companyId,
    supportContactId: deal.contactId
  };
}

function normalizeCreateLeadInput(input: CreatePetCommercialLeadInput) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: input.source,
    status: input.status,
    assignedUserId: input.assignedUserId,
    companyId: resolveLegacyAccountId(input),
    contactId: resolveLegacySupportContactId(input),
    notes: input.notes
  };
}

function normalizeUpdateLeadInput(input: UpdatePetCommercialLeadInput) {
  return {
    ...normalizeCreateLeadInput(input),
    status: input.status
  };
}

function normalizeCreateDealInput(input: CreatePetCommercialDealInput) {
  return {
    title: input.title,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    companyId: resolveRequiredLegacyAccountId(input),
    pipelineStageId: input.pipelineStageId,
    contactId: resolveLegacySupportContactId(input),
    leadId: input.leadId,
    ownerUserId: input.ownerUserId,
    expectedCloseDate: input.expectedCloseDate
  };
}

function normalizeUpdateDealInput(input: UpdatePetCommercialDealInput) {
  return {
    ...normalizeCreateDealInput(input),
    status: input.status
  };
}

// PetFlow owns the frontend commercial contract now. Legacy CRM endpoints
// remain underneath only as the temporary API/storage compatibility layer.
export const petCommercialService = {
  async listAccounts(page = 0, size = 20, search = '', filters: PetCommercialAccountFilters = {}) {
    const response = await crmService.listCompanies(page, size, search, filters);
    return mapPageResponse(response, mapAccount);
  },

  async listCompanies(page = 0, size = 20, search = '', filters: PetCommercialAccountFilters = {}) {
    return petCommercialService.listAccounts(page, size, search, filters);
  },

  async listSupportContacts(page = 0, size = 20, search = '', filters: PetCommercialSupportContactFilters = {}) {
    const response = await crmService.listContacts(page, size, search, {
      status: filters.status,
      companyId: resolveLegacyAccountId(filters),
      ownerUserId: filters.ownerUserId
    });
    return mapPageResponse(response, mapSupportContact);
  },

  async listContacts(page = 0, size = 20, search = '', filters: PetCommercialSupportContactFilters = {}) {
    return petCommercialService.listSupportContacts(page, size, search, filters);
  },

  async listLeads(page = 0, size = 20, search = '', filters: PetCommercialLeadFilters = {}) {
    const response = await crmService.listLeads(page, size, search, {
      status: filters.status,
      source: filters.source,
      companyId: resolveLegacyAccountId(filters),
      contactId: resolveLegacySupportContactId(filters),
      assignedUserId: filters.assignedUserId
    });
    return mapPageResponse(response, mapLead);
  },

  async getLead(id: string) {
    return mapLead(await crmService.getLead(id));
  },

  async createLead(input: CreatePetCommercialLeadInput) {
    return mapLead(await crmService.createLead(normalizeCreateLeadInput(input)));
  },

  async updateLead(id: string, input: UpdatePetCommercialLeadInput) {
    return mapLead(await crmService.updateLead(id, normalizeUpdateLeadInput(input)));
  },

  deleteLead(id: string) {
    return crmService.deleteLead(id);
  },

  async listDeals(page = 0, size = 20, search = '', filters: PetCommercialDealFilters = {}) {
    const response = await crmService.listDeals(page, size, search, {
      status: filters.status,
      companyId: resolveLegacyAccountId(filters),
      pipelineStageId: filters.pipelineStageId,
      ownerUserId: filters.ownerUserId
    });
    return mapPageResponse(response, mapDeal);
  },

  async getDeal(id: string) {
    return mapDeal(await crmService.getDeal(id));
  },

  async createDeal(input: CreatePetCommercialDealInput) {
    return mapDeal(await crmService.createDeal(normalizeCreateDealInput(input)));
  },

  async updateDeal(id: string, input: UpdatePetCommercialDealInput) {
    return mapDeal(await crmService.updateDeal(id, normalizeUpdateDealInput(input)));
  },

  deleteDeal(id: string) {
    return crmService.deleteDeal(id);
  },

  async listPipelineStages(page = 0, size = 20, search = '') {
    const response = await crmService.listPipelineStages(page, size, search);
    return mapPageResponse(response, mapPipelineStage);
  },

  async getPipelineStage(id: string) {
    return mapPipelineStage(await crmService.getPipelineStage(id));
  },

  async createPipelineStage(input: CreatePetCommercialPipelineStageInput) {
    return mapPipelineStage(await crmService.createPipelineStage(input));
  },

  async updatePipelineStage(id: string, input: UpdatePetCommercialPipelineStageInput) {
    return mapPipelineStage(await crmService.updatePipelineStage(id, input));
  },

  deletePipelineStage(id: string) {
    return crmService.deletePipelineStage(id);
  },

  async getDashboardSummary() {
    return mapDashboardSummary(await crmService.getDashboardSummary());
  }
};
