'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildReferenceContextLine,
  buildReferenceHeadline,
  resolveCanonicalReference
} from '@/modules/crm/crm-reference-utils';
import {
  buildRelatedReferenceOptions,
  buildRelatedReferenceTypeOptions,
  CrmRelatedReferenceType,
  normalizeRelatedReferenceType
} from '@/modules/crm/crm-related-reference-catalog';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService } from '@/shared/services/crm-service';
import { petFollowUpService } from '@/shared/services/pet-follow-up-service';
import { petService } from '@/shared/services/pet-service';
import { CrmActivityItem, CrmCompany, CrmContact, CrmDeal, CrmLead } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;
const initialPage: PageResponse<CrmActivityItem> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };
const emptyCommonPage: PageResponse<CrmCompany | CrmContact | CrmLead | CrmDeal | PetClient | PetProfile | PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: 100
};

type CrmActivityPageProps = {
  surface?: 'crm' | 'pet';
};

const petFollowUpRelationTypes = new Set<CrmRelatedReferenceType>(['PET.CLIENT', 'PET.PROFILE', 'PET.APPOINTMENT']);

function payloadSummary(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  if (!json || json === '{}') {
    return '-';
  }
  return json.length > 120 ? `${json.slice(0, 117)}...` : json;
}

export function CrmActivityPage({ surface = 'crm' }: CrmActivityPageProps) {
  const { hasPermission } = usePermissions();
  const isPetSurface = surface === 'pet';
  const activityService = isPetSurface ? petFollowUpService : crmService;
  const [pageData, setPageData] = useState<PageResponse<CrmActivityItem>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [petClients, setPetClients] = useState<PetClient[]>([]);
  const [petProfiles, setPetProfiles] = useState<PetProfile[]>([]);
  const [petAppointments, setPetAppointments] = useState<PetAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [relationTypeFilter, setRelationTypeFilter] = useState<CrmRelatedReferenceType | ''>('');
  const [relationIdFilter, setRelationIdFilter] = useState('');

  const canReadPetClients = hasPermission('pet.client.read');
  const canReadPetProfiles = hasPermission('pet.profile.read');
  const canReadPetAppointments = hasPermission('pet.appointment.read');
  const relationTypeOptions = useMemo(
    () => buildRelatedReferenceTypeOptions({
      canReadPetClients,
      canReadPetProfiles,
      canReadPetAppointments
    }).filter((option) => !isPetSurface || petFollowUpRelationTypes.has(option.value)),
    [canReadPetAppointments, canReadPetClients, canReadPetProfiles, isPetSurface]
  );
  const relationFilterTypeOptions = [{ value: '', label: 'Todos' }, ...relationTypeOptions];
  const pageTitle = isPetSurface ? 'Atividade de follow-up do PetFlow' : 'CRM Activity';
  const pageDescription = isPetSurface
    ? 'Acompanhe a trilha de tarefas e notas ligadas a clientes, pets e atendimentos. Eventos históricos continuam legíveis enquanto o fluxo é absorvido pelo PetFlow.'
    : 'Feed auditável com contexto canônico da entidade CRM e do vínculo relacionado quando houver referência cross-module.';
  const permissionFallback = isPetSurface
    ? 'Você não possui permissão para visualizar a atividade de follow-up do PetFlow.'
    : 'Você não possui permissão para visualizar a atividade do CRM.';

  useEffect(() => {
    if (relationTypeFilter && !relationTypeOptions.some((option) => option.value === relationTypeFilter)) {
      setRelationTypeFilter('');
      setRelationIdFilter('');
    }
  }, [relationTypeFilter, relationTypeOptions]);

  useEffect(() => {
    async function loadSupportingData() {
      try {
        const [companiesPage, contactsPage, leadsPage, dealsPage, petClientsPage, petProfilesPage, petAppointmentsPage] = await Promise.all([
          isPetSurface ? Promise.resolve(emptyCommonPage as PageResponse<CrmCompany>) : crmService.listCompanies(0, 100),
          isPetSurface ? Promise.resolve(emptyCommonPage as PageResponse<CrmContact>) : crmService.listContacts(0, 100),
          isPetSurface ? Promise.resolve(emptyCommonPage as PageResponse<CrmLead>) : crmService.listLeads(0, 100),
          isPetSurface ? Promise.resolve(emptyCommonPage as PageResponse<CrmDeal>) : crmService.listDeals(0, 100),
          canReadPetClients ? petService.listClients(0, 100) : Promise.resolve(emptyCommonPage as PageResponse<PetClient>),
          canReadPetProfiles ? petService.listProfiles(0, 100) : Promise.resolve(emptyCommonPage as PageResponse<PetProfile>),
          canReadPetAppointments ? petService.listAppointments(0, 100) : Promise.resolve(emptyCommonPage as PageResponse<PetAppointment>)
        ]);
        setCompanies(resolvePageItems(companiesPage));
        setContacts(resolvePageItems(contactsPage));
        setLeads(resolvePageItems(leadsPage));
        setDeals(resolvePageItems(dealsPage));
        setPetClients(resolvePageItems(petClientsPage));
        setPetProfiles(resolvePageItems(petProfilesPage));
        setPetAppointments(resolvePageItems(petAppointmentsPage));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar referências de atividade.');
      }
    }

    void loadSupportingData();
  }, [canReadPetAppointments, canReadPetClients, canReadPetProfiles, isPetSurface]);

  useEffect(() => {
    if (filtersReady) {
      return;
    }

    const params = typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
    const initialRelationType = normalizeRelatedReferenceType(params.get('relatedReferenceType'));
    const allowedRelationType = initialRelationType && relationTypeOptions.some((option) => option.value === initialRelationType)
      ? initialRelationType
      : '';

    setRelationTypeFilter(allowedRelationType);
    setRelationIdFilter(allowedRelationType ? (params.get('relatedId')?.trim() ?? '') : '');
    setFiltersReady(true);
  }, [filtersReady, relationTypeOptions]);

  const load = useCallback(async (page: number, currentRelationType: CrmRelatedReferenceType | '', currentRelationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await activityService.listActivity(page, pageSize, {
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar atividade.');
    } finally {
      setLoading(false);
    }
  }, [activityService]);

  useEffect(() => {
    if (!filtersReady) {
      return;
    }
    void load(0, relationTypeFilter, relationIdFilter);
  }, [filtersReady, load, relationIdFilter, relationTypeFilter]);

  function relationOptions(currentRelationType: CrmRelatedReferenceType) {
    return buildRelatedReferenceOptions(currentRelationType, {
      companies,
      contacts,
      leads,
      deals,
      petClients,
      petProfiles,
      petAppointments
    });
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmActivityItem>[] = [
    { key: 'eventType', header: 'Evento', render: (row) => row.eventType },
    {
      key: 'entity',
      header: 'Entidade',
      render: (row) => {
        const entity = resolveCanonicalReference({
          referenceType: row.entityReferenceType,
          moduleCode: row.entityModule,
          entityType: row.entityType,
          fallbackReferenceType: row.entity.replace('_', '.')
        });

        return (
          <div>
            <p className="font-medium text-[color:var(--app-shell-heading)]">{buildReferenceHeadline(entity)}</p>
            <p className="text-xs text-[color:var(--app-shell-muted)]">{buildReferenceContextLine(entity, row.entityId)}</p>
          </div>
        );
      }
    },
    {
      key: 'related',
      header: 'Relacionado a',
      render: (row) => {
        if (!row.relatedId) {
          return '-';
        }

        const relation = resolveCanonicalReference({
          compatibilityType: row.relatedType,
          referenceType: row.relatedReferenceType,
          moduleCode: row.relatedModule,
          entityType: row.relatedEntityType
        });

        return (
          <div>
            <p className="font-medium text-[color:var(--app-shell-heading)]">{buildReferenceHeadline(relation, row.relatedDisplayName)}</p>
            <p className="text-xs text-[color:var(--app-shell-muted)]">{buildReferenceContextLine(relation, row.relatedId, row.relatedDisplayContext)}</p>
          </div>
        );
      }
    },
    { key: 'user', header: 'Usuário', render: (row) => row.userId ?? '-' },
    { key: 'payload', header: 'Payload', render: (row) => payloadSummary(row.payload) },
    { key: 'createdAt', header: 'Data', render: (row) => new Date(row.createdAt).toLocaleString('pt-BR') }
  ];

  return (
    <PermissionGuard
      permission="crm.activity.read"
      fallback={<div className="ui-notice-warning">{permissionFallback}</div>}
    >
      <div className="space-y-5">
        <PageTitle title={pageTitle} description={pageDescription} eyebrow={isPetSurface ? 'PetFlow' : undefined} />

        <div className="grid gap-3 ui-surface-panel p-4 xl:grid-cols-[180px_220px_auto]">
          <FormSelect
            label="Tipo de vínculo"
            value={relationTypeFilter}
            options={relationFilterTypeOptions}
            onChange={(value) => {
              setRelationTypeFilter(value as CrmRelatedReferenceType | '');
              setRelationIdFilter('');
            }}
          />
          <FormSelect
            label="Registro vinculado"
            value={relationIdFilter}
            options={[
              { value: '', label: relationTypeFilter ? 'Todos' : 'Selecione um tipo' },
              ...(relationTypeFilter ? relationOptions(relationTypeFilter) : [])
            ]}
            onChange={setRelationIdFilter}
            disabled={!relationTypeFilter}
          />
          <button
            type="button"
            onClick={() => {
              setRelationTypeFilter('');
              setRelationIdFilter('');
            }}
            className="ui-secondary-button"
          >
            Limpar
          </button>
        </div>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhum evento encontrado." />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => void load(nextPage, relationTypeFilter, relationIdFilter)}
        />
      </div>
    </PermissionGuard>
  );
}
