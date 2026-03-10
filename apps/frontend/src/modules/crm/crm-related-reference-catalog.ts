import { CanonicalReferenceContext } from '@/modules/crm/crm-reference-utils';
import { CrmCompany, CrmContact, CrmDeal, CrmLead } from '@/shared/types/crm';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';

export type CrmRelatedReferenceType =
  | 'COMPANY'
  | 'CONTACT'
  | 'LEAD'
  | 'DEAL'
  | 'PET.CLIENT'
  | 'PET.PROFILE'
  | 'PET.APPOINTMENT';

type ReferenceCatalogInput = {
  companies: CrmCompany[];
  contacts: CrmContact[];
  leads: CrmLead[];
  deals: CrmDeal[];
  petClients: PetClient[];
  petProfiles: PetProfile[];
  petAppointments: PetAppointment[];
};

type AvailablePetReferences = {
  canReadPetClients: boolean;
  canReadPetProfiles: boolean;
  canReadPetAppointments: boolean;
};

export function buildRelatedReferenceTypeOptions(available: AvailablePetReferences) {
  const options: Array<{ value: CrmRelatedReferenceType; label: string }> = [
    { value: 'COMPANY', label: 'Empresa CRM' },
    { value: 'CONTACT', label: 'Contato CRM' },
    { value: 'LEAD', label: 'Lead CRM' },
    { value: 'DEAL', label: 'Negócio CRM' }
  ];

  if (available.canReadPetClients) {
    options.push({ value: 'PET.CLIENT', label: 'Cliente Pet' });
  }
  if (available.canReadPetProfiles) {
    options.push({ value: 'PET.PROFILE', label: 'Pet' });
  }
  if (available.canReadPetAppointments) {
    options.push({ value: 'PET.APPOINTMENT', label: 'Atendimento Pet' });
  }

  return options;
}

export function buildRelatedReferenceOptions(
  referenceType: CrmRelatedReferenceType,
  input: ReferenceCatalogInput
) {
  switch (referenceType) {
    case 'CONTACT':
      return input.contacts.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName ?? ''}`.trim() }));
    case 'LEAD':
      return input.leads.map((item) => ({ value: item.id, label: item.name }));
    case 'DEAL':
      return input.deals.map((item) => ({ value: item.id, label: item.title }));
    case 'PET.CLIENT':
      return input.petClients.map((item) => ({ value: item.id, label: item.fullName ?? item.name }));
    case 'PET.PROFILE':
      return input.petProfiles.map((item) => ({ value: item.id, label: item.name }));
    case 'PET.APPOINTMENT':
      return input.petAppointments.map((item) => ({
        value: item.id,
        label: [item.serviceName, item.petName].filter(Boolean).join(' · ') || item.id
      }));
    case 'COMPANY':
    default:
      return input.companies.map((item) => ({ value: item.id, label: item.name }));
  }
}

export function buildRelatedReferencePayload(referenceType: CrmRelatedReferenceType, relatedId: string) {
  if (referenceType.startsWith('PET.')) {
    return {
      relatedReferenceType: referenceType,
      relatedId
    };
  }

  return {
    companyId: referenceType === 'COMPANY' ? relatedId : undefined,
    contactId: referenceType === 'CONTACT' ? relatedId : undefined,
    leadId: referenceType === 'LEAD' ? relatedId : undefined,
    dealId: referenceType === 'DEAL' ? relatedId : undefined
  };
}

export function resolveEditableReferenceType(context: CanonicalReferenceContext): CrmRelatedReferenceType | null {
  if (context.moduleCode === 'CRM' && context.entityType) {
    const crmType = context.entityType as CrmRelatedReferenceType;
    if (crmType === 'COMPANY' || crmType === 'CONTACT' || crmType === 'LEAD' || crmType === 'DEAL') {
      return crmType;
    }
  }

  if (context.referenceType === 'PET.CLIENT' || context.referenceType === 'PET.PROFILE' || context.referenceType === 'PET.APPOINTMENT') {
    return context.referenceType as CrmRelatedReferenceType;
  }

  return null;
}
