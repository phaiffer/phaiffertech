'use client';

import { useEffect, useState } from 'react';
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

function payloadSummary(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  if (!json || json === '{}') {
    return '-';
  }
  return json.length > 120 ? `${json.slice(0, 117)}...` : json;
}

export function CrmActivityPage() {
  const { hasPermission } = usePermissions();
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
  const relationTypeOptions = buildRelatedReferenceTypeOptions({
    canReadPetClients,
    canReadPetProfiles,
    canReadPetAppointments
  });
  const relationFilterTypeOptions = [{ value: '', label: 'Todos' }, ...relationTypeOptions];

  useEffect(() => {
    async function loadSupportingData() {
      try {
        const [companiesPage, contactsPage, leadsPage, dealsPage, petClientsPage, petProfilesPage, petAppointmentsPage] = await Promise.all([
          crmService.listCompanies(0, 100),
          crmService.listContacts(0, 100),
          crmService.listLeads(0, 100),
          crmService.listDeals(0, 100),
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
  }, [canReadPetAppointments, canReadPetClients, canReadPetProfiles]);

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

  useEffect(() => {
    if (!filtersReady) {
      return;
    }
    void load(0, relationTypeFilter, relationIdFilter);
  }, [filtersReady, relationTypeFilter, relationIdFilter]);

  async function load(page: number, currentRelationType: CrmRelatedReferenceType | '', currentRelationId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listActivity(page, pageSize, {
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar atividade.');
    } finally {
      setLoading(false);
    }
  }

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
            <p className="font-medium text-slate-900">{buildReferenceHeadline(entity)}</p>
            <p className="text-xs text-slate-500">{buildReferenceContextLine(entity, row.entityId)}</p>
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
            <p className="font-medium text-slate-900">{buildReferenceHeadline(relation, row.relatedDisplayName)}</p>
            <p className="text-xs text-slate-500">{buildReferenceContextLine(relation, row.relatedId, row.relatedDisplayContext)}</p>
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
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar a atividade do CRM.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Activity" description="Feed auditável com contexto canônico da entidade CRM e do vínculo relacionado quando houver referência cross-module." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:grid-cols-[180px_220px_auto]">
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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

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
