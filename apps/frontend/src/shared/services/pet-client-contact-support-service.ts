import {
  crmService,
  CreateContactInput,
  UpdateContactInput
} from '@/shared/services/crm-service';

export type CreatePetClientSupportContactInput = CreateContactInput;
export type UpdatePetClientSupportContactInput = UpdateContactInput;

// PetFlow owns the visible support-contact surface. CRM endpoints remain only
// as the temporary persistence/API layer until client-linked storage is ready.
export const petClientContactSupportService = {
  listContacts: crmService.listContacts,
  getContact: crmService.getContact,
  createContact: crmService.createContact,
  updateContact: crmService.updateContact,
  deleteContact: crmService.deleteContact,
  listCompanies: crmService.listCompanies
};
