import {
  CreateDealInput,
  CreateLeadInput,
  CreatePipelineStageInput,
  UpdateDealInput,
  UpdateLeadInput,
  UpdatePipelineStageInput,
  crmService
} from '@/shared/services/crm-service';

export type CreatePetCommercialLeadInput = CreateLeadInput;
export type UpdatePetCommercialLeadInput = UpdateLeadInput;
export type CreatePetCommercialDealInput = CreateDealInput;
export type UpdatePetCommercialDealInput = UpdateDealInput;
export type CreatePetCommercialPipelineStageInput = CreatePipelineStageInput;
export type UpdatePetCommercialPipelineStageInput = UpdatePipelineStageInput;

// PetFlow owns the visible commercial surface. CRM endpoints remain only as the
// temporary persistence/API layer until commercial storage is absorbed safely.
export const petCommercialService = {
  listCompanies: crmService.listCompanies,
  listContacts: crmService.listContacts,
  listLeads: crmService.listLeads,
  getLead: crmService.getLead,
  createLead: crmService.createLead,
  updateLead: crmService.updateLead,
  deleteLead: crmService.deleteLead,
  listDeals: crmService.listDeals,
  getDeal: crmService.getDeal,
  createDeal: crmService.createDeal,
  updateDeal: crmService.updateDeal,
  deleteDeal: crmService.deleteDeal,
  listPipelineStages: crmService.listPipelineStages,
  getPipelineStage: crmService.getPipelineStage,
  createPipelineStage: crmService.createPipelineStage,
  updatePipelineStage: crmService.updatePipelineStage,
  deletePipelineStage: crmService.deletePipelineStage,
  getDashboardSummary: crmService.getDashboardSummary
};
