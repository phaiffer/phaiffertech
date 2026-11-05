import { CanonicalReferenceContext, resolveCanonicalReference } from '@/modules/crm/crm-reference-utils';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';

export type CrmRelatedReferenceType = 'PET.CLIENT' | 'PET.PROFILE' | 'PET.APPOINTMENT';

export type RelatedReferenceCatalog = {
  petClients: PetClient[];
  petProfiles: PetProfile[];
  petAppointments: PetAppointment[];
};

type AvailablePetReferences = {
  canReadPetClients: boolean;
  canReadPetProfiles: boolean;
  canReadPetAppointments: boolean;
};

type RelatedReferenceLabels = {
  client: string;
  pet: string;
  appointment: string;
};

export function buildRelatedReferenceTypeOptions(available: AvailablePetReferences, labels: RelatedReferenceLabels) {
  const options: Array<{ value: CrmRelatedReferenceType; label: string }> = [];

  if (available.canReadPetClients) {
    options.push({ value: 'PET.CLIENT', label: labels.client });
  }
  if (available.canReadPetProfiles) {
    options.push({ value: 'PET.PROFILE', label: labels.pet });
  }
  if (available.canReadPetAppointments) {
    options.push({ value: 'PET.APPOINTMENT', label: labels.appointment });
  }

  return options;
}

export function buildRelatedReferenceOptions(
  referenceType: CrmRelatedReferenceType,
  catalog: RelatedReferenceCatalog
) {
  switch (referenceType) {
    case 'PET.PROFILE':
      return catalog.petProfiles.map((item) => ({ value: item.id, label: item.name }));
    case 'PET.APPOINTMENT':
      return catalog.petAppointments.map((item) => ({
        value: item.id,
        label: [item.serviceName, item.petName].filter(Boolean).join(' · ') || item.id
      }));
    case 'PET.CLIENT':
    default:
      return catalog.petClients.map((item) => ({ value: item.id, label: item.fullName ?? item.name }));
  }
}

export function resolveEditableReferenceType(context: CanonicalReferenceContext): CrmRelatedReferenceType | null {
  if (context.referenceType === 'PET.CLIENT' || context.referenceType === 'PET.PROFILE' || context.referenceType === 'PET.APPOINTMENT') {
    return context.referenceType;
  }

  return null;
}

export function normalizeRelatedReferenceType(value?: string | null): CrmRelatedReferenceType | null {
  if (!value) {
    return null;
  }

  return resolveEditableReferenceType(resolveCanonicalReference({ referenceType: value }));
}
