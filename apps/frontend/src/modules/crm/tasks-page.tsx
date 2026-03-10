'use client';

import { useEffect, useState } from 'react';
import {
  buildReferenceContextLine,
  buildReferenceHeadline,
  resolveCanonicalReference
} from '@/modules/crm/crm-reference-utils';
import {
  buildRelatedReferenceOptions,
  buildRelatedReferencePayload,
  buildRelatedReferenceTypeOptions,
  CrmRelatedReferenceType,
  normalizeRelatedReferenceType,
  resolveEditableReferenceType
} from '@/modules/crm/crm-related-reference-catalog';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreateTaskInput, UpdateTaskInput } from '@/shared/services/crm-service';
import { petService } from '@/shared/services/pet-service';
import { CrmCompany, CrmContact, CrmDeal, CrmLead, CrmTask } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateInput } from '@/shared/ui/date-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'OPEN' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'DONE', label: 'DONE' }
];
const priorityOptions = [
  { value: '', label: 'Todas' },
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' }
];
const initialPage: PageResponse<CrmTask> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };
const emptyCommonPage: PageResponse<CrmCompany | CrmContact | CrmLead | CrmDeal | PetClient | PetProfile | PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: 100
};

export function CrmTasksPage() {
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<CrmTask>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [petClients, setPetClients] = useState<PetClient[]>([]);
  const [petProfiles, setPetProfiles] = useState<PetProfile[]>([]);
  const [petAppointments, setPetAppointments] = useState<PetAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmTask | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [relationTypeFilter, setRelationTypeFilter] = useState<CrmRelatedReferenceType | ''>('');
  const [relationIdFilter, setRelationIdFilter] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('MEDIUM');
  const [relationType, setRelationType] = useState<CrmRelatedReferenceType>('COMPANY');
  const [relationId, setRelationId] = useState('');

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
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar referências de tarefa.');
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

    const initialSearch = params.get('search')?.trim() ?? '';
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setStatusFilter(params.get('status')?.trim() ?? '');
    setPriorityFilter(params.get('priority')?.trim() ?? '');
    setRelationTypeFilter(allowedRelationType);
    setRelationIdFilter(allowedRelationType ? (params.get('relatedId')?.trim() ?? '') : '');
    setFiltersReady(true);
  }, [filtersReady, relationTypeOptions]);

  useEffect(() => {
    if (!filtersReady) {
      return;
    }
    void load(0, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter);
  }, [filtersReady, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter]);

  async function load(
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentPriority: string,
    currentRelationType: CrmRelatedReferenceType | '',
    currentRelationId: string
  ) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listTasks(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        priority: currentPriority || undefined,
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar tarefas.');
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

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setStatus('OPEN');
    setPriority('MEDIUM');
    setRelationType('COMPANY');
    setRelationId('');
  }

  function relationPayload(id: string) {
    return buildRelatedReferencePayload(relationType, id);
  }

  async function handleSubmit() {
    if (!title.trim() || !relationId) {
      setError('Título e vínculo são obrigatórios.');
      return;
    }

    const payload: CreateTaskInput | UpdateTaskInput = {
      title,
      description: description || undefined,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00Z`).toISOString() : undefined,
      status,
      priority,
      ...relationPayload(relationId)
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await crmService.updateTask(editingId, payload as UpdateTaskInput);
      } else {
        await crmService.createTask(payload);
      }
      resetForm();
      await load(pageData.page, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await crmService.deleteTask(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir tarefa.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmTask>[] = [
    { key: 'title', header: 'Tarefa', render: (row) => row.title },
    {
      key: 'relation',
      header: 'Vínculo',
      render: (row) => {
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
    { key: 'dueDate', header: 'Prazo', render: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString('pt-BR') : '-' },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'priority', header: 'Prioridade', render: (row) => row.priority },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => {
        const relation = resolveCanonicalReference({
          compatibilityType: row.relatedType,
          referenceType: row.relatedReferenceType,
          moduleCode: row.relatedModule,
          entityType: row.relatedEntityType
        });
        const editableRelation = resolveEditableReferenceType(relation);
        const canEditRelation = editableRelation
          ? relationTypeOptions.some((option) => option.value === editableRelation)
          : false;

        return (
          <div className="flex gap-2">
            <PermissionGuard permission="crm.task.update">
              {canEditRelation && editableRelation ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(row.id);
                    setTitle(row.title);
                    setDescription(row.description ?? '');
                    setDueDate(row.dueDate ? row.dueDate.slice(0, 10) : '');
                    setStatus(row.status);
                    setPriority(row.priority);
                    setRelationType(editableRelation);
                    setRelationId(row.relatedId);
                  }}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                >
                  Editar
                </button>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500">
                  Somente leitura
                </span>
              )}
            </PermissionGuard>
            <PermissionGuard permission="crm.task.delete">
              <button
                type="button"
                onClick={() => setDeleteCandidate(row)}
                className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
              >
                Excluir
              </button>
            </PermissionGuard>
          </div>
        );
      }
    }
  ];

  return (
    <PermissionGuard
      permission="crm.task.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar tarefas.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Tasks" description="Tarefas vinculadas a registros do CRM e, quando permitido, a referências canônicas do PetFlow." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:grid-cols-[1fr_160px_160px_180px_220px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Título, descrição, prioridade" />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FormSelect label="Prioridade" value={priorityFilter} options={priorityOptions} onChange={setPriorityFilter} />
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
          <button type="button" onClick={() => setSearch(searchInput)} className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
              setRelationTypeFilter('');
              setRelationIdFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'crm.task.update' : 'crm.task.create'}>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Título" value={title} onChange={setTitle} required />
            <FormInput label="Descrição" value={description} onChange={setDescription} />
            <DateInput label="Prazo" value={dueDate} onChange={setDueDate} />
            <FormSelect label="Status" value={status} options={statusOptions.filter((option) => option.value)} onChange={setStatus} />
            <FormSelect label="Prioridade" value={priority} options={priorityOptions.filter((option) => option.value)} onChange={setPriority} />
            <FormSelect label="Tipo de vínculo" value={relationType} options={relationTypeOptions} onChange={(value) => { setRelationType(value as CrmRelatedReferenceType); setRelationId(''); }} />
            <FormSelect label="Registro vinculado" value={relationId} options={[{ value: '', label: 'Selecione' }, ...relationOptions(relationType)]} onChange={setRelationId} />
            <p className="text-xs text-slate-500 md:col-span-2">
              Os vínculos CRM legados continuam compatíveis. Referências Pet aparecem quando o usuário possui leitura do recurso correspondente e são enviadas pelo tipo canônico.
            </p>
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                disabled={saving || !title.trim()}
                onClick={() => void handleSubmit()}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {editingId ? 'Salvar tarefa' : 'Criar tarefa'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Cancelar
              </button>
            </div>
          </div>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma tarefa encontrada." />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => void load(nextPage, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir tarefa"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.title}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
