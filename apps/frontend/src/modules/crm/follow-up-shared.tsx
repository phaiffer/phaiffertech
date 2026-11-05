'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CanonicalReferenceContext, resolveCanonicalReference } from '@/modules/crm/crm-reference-utils';
import {
  buildRelatedReferenceOptions,
  buildRelatedReferenceTypeOptions,
  CrmRelatedReferenceType,
  normalizeRelatedReferenceType,
  RelatedReferenceCatalog
} from '@/modules/crm/crm-related-reference-catalog';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';
import { FilterChip } from '@/shared/ui/filter-chip';
import { FormSelect } from '@/shared/ui/form-select';

type SelectOption = { value: string; label: string };
type ReferenceTypeOption = { value: CrmRelatedReferenceType; label: string };

const lookupSize = 200;
const isoDateTimePattern = /\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})?/g;
const emptyCatalog: RelatedReferenceCatalog = { petClients: [], petProfiles: [], petAppointments: [] };

function emptyPage<T>(): PageResponse<T> {
  return { items: [], totalItems: 0, totalPages: 0, page: 0, size: lookupSize };
}

function settledItems<T>(result: PromiseSettledResult<PageResponse<T>>) {
  return result.status === 'fulfilled' ? resolvePageItems(result.value) : [];
}

export function useFollowUpReferences() {
  const { hasPermission } = usePermissions();
  const copy = useAppMessages().screens.petFollowUp;
  const [catalog, setCatalog] = useState<RelatedReferenceCatalog>(emptyCatalog);
  const [error, setError] = useState<string | null>(null);
  const canReadPetClients = hasPermission('pet.client.read');
  const canReadPetProfiles = hasPermission('pet.profile.read');
  const canReadPetAppointments = hasPermission('pet.appointment.read');

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      const [clients, profiles, appointments] = await Promise.allSettled([
        canReadPetClients ? petService.listClients(0, lookupSize) : Promise.resolve(emptyPage<PetClient>()),
        canReadPetProfiles ? petService.listProfiles(0, lookupSize) : Promise.resolve(emptyPage<PetProfile>()),
        canReadPetAppointments ? petService.listAppointments(0, lookupSize) : Promise.resolve(emptyPage<PetAppointment>())
      ]);
      if (!active) {
        return;
      }

      setCatalog({
        petClients: settledItems(clients),
        petProfiles: settledItems(profiles),
        petAppointments: settledItems(appointments)
      });
      const failure = [clients, profiles, appointments].find((result) => result.status === 'rejected');
      setError(failure?.status === 'rejected' ? resolveApiErrorMessage(failure.reason, copy.referencesLoadError) : null);
    }

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [canReadPetAppointments, canReadPetClients, canReadPetProfiles, copy.referencesLoadError]);

  const typeOptions = useMemo(
    () => buildRelatedReferenceTypeOptions(
      { canReadPetClients, canReadPetProfiles, canReadPetAppointments },
      { client: copy.referenceClient, pet: copy.referencePet, appointment: copy.referenceAppointment }
    ),
    [canReadPetAppointments, canReadPetClients, canReadPetProfiles, copy]
  );
  const recordOptions = useCallback(
    (referenceType: CrmRelatedReferenceType) => buildRelatedReferenceOptions(referenceType, catalog),
    [catalog]
  );

  return { typeOptions, recordOptions, error };
}

/** Links such as the pet profile open a follow-up tab already filtered by one record. */
export function readRelationFilterFromUrl(typeOptions: ReferenceTypeOption[]) {
  const params = new URLSearchParams(window.location.search);
  const requestedType = normalizeRelatedReferenceType(params.get('relatedReferenceType'));
  const relationType: CrmRelatedReferenceType | '' = requestedType && typeOptions.some((option) => option.value === requestedType)
    ? requestedType
    : '';

  return {
    params,
    relationType,
    relationId: relationType ? (params.get('relatedId')?.trim() ?? '') : ''
  };
}

export function resolveRowReference(row: {
  relatedType?: string;
  relatedReferenceType?: string;
  relatedModule?: string;
  relatedEntityType?: string;
}) {
  return resolveCanonicalReference({
    compatibilityType: row.relatedType,
    referenceType: row.relatedReferenceType,
    moduleCode: row.relatedModule,
    entityType: row.relatedEntityType
  });
}

type ReferenceCellProps = {
  reference: CanonicalReferenceContext;
  displayName?: string | null;
  displayContext?: string | null;
};

export function ReferenceCell({ reference, displayName, displayContext }: ReferenceCellProps) {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petFollowUp;
  const entityLabels: Record<string, string> = copy.entities;
  const label = (reference.entityType ? entityLabels[reference.entityType] : undefined) ?? copy.entityUnknown;
  const name = displayName?.trim();
  // The API composes this text, including raw ISO timestamps for appointments.
  const context = displayContext?.trim().replace(isoDateTimePattern, (value) => formatDateTimeForLocale(locale, value, value));
  const detail = [name ? label : null, context].filter(Boolean).join(' · ');

  return (
    <div>
      <p className="font-medium text-[var(--ink)]">{name || label}</p>
      {detail ? <p className="text-xs text-[var(--ink-2)]">{detail}</p> : null}
    </div>
  );
}

type RelationFilterChipsProps = {
  relationType: CrmRelatedReferenceType | '';
  relationId: string;
  typeOptions: ReferenceTypeOption[];
  recordOptions: (referenceType: CrmRelatedReferenceType) => SelectOption[];
  onRelationTypeChange: (value: CrmRelatedReferenceType | '') => void;
  onRelationIdChange: (value: string) => void;
};

export function RelationFilterChips({
  relationType,
  relationId,
  typeOptions,
  recordOptions,
  onRelationTypeChange,
  onRelationIdChange
}: RelationFilterChipsProps) {
  const copy = useAppMessages().screens.petFollowUp;

  return (
    <>
      <FilterChip
        label={copy.fieldRelationType}
        value={relationType}
        options={[{ value: '', label: copy.all }, ...typeOptions]}
        onChange={(value) => {
          onRelationTypeChange(value as CrmRelatedReferenceType | '');
          onRelationIdChange('');
        }}
      />
      <FilterChip
        label={copy.fieldRelation}
        value={relationId}
        options={[
          { value: '', label: relationType ? copy.all : copy.selectTypeFirst },
          ...(relationType ? recordOptions(relationType) : [])
        ]}
        onChange={onRelationIdChange}
        disabled={!relationType}
      />
    </>
  );
}

type RelationFieldsProps = {
  relationType: CrmRelatedReferenceType;
  relationId: string;
  typeOptions: ReferenceTypeOption[];
  recordOptions: (referenceType: CrmRelatedReferenceType) => SelectOption[];
  onRelationTypeChange: (value: CrmRelatedReferenceType) => void;
  onRelationIdChange: (value: string) => void;
};

export function RelationFields({
  relationType,
  relationId,
  typeOptions,
  recordOptions,
  onRelationTypeChange,
  onRelationIdChange
}: RelationFieldsProps) {
  const copy = useAppMessages().screens.petFollowUp;

  return (
    <>
      <FormSelect
        label={copy.fieldRelationType}
        value={relationType}
        options={typeOptions}
        onChange={(value) => {
          onRelationTypeChange(value as CrmRelatedReferenceType);
          onRelationIdChange('');
        }}
      />
      <FormSelect
        label={copy.fieldRelation}
        value={relationId}
        options={[{ value: '', label: copy.select }, ...recordOptions(relationType)]}
        onChange={onRelationIdChange}
      />
    </>
  );
}
