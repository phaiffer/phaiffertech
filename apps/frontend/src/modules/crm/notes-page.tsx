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
import { crmService, CreateNoteInput, UpdateNoteInput } from '@/shared/services/crm-service';
import { petService } from '@/shared/services/pet-service';
import { CrmCompany, CrmContact, CrmDeal, CrmLead, CrmNote } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;
const initialPage: PageResponse<CrmNote> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };
const emptyCommonPage: PageResponse<CrmCompany | CrmContact | CrmLead | CrmDeal | PetClient | PetProfile | PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: 100
};

export function CrmNotesPage() {
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<CrmNote>>(initialPage);
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
  const [deleteCandidate, setDeleteCandidate] = useState<CrmNote | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [relationTypeFilter, setRelationTypeFilter] = useState<CrmRelatedReferenceType | ''>('');
  const [relationIdFilter, setRelationIdFilter] = useState('');
  const [relationType, setRelationType] = useState<CrmRelatedReferenceType>('COMPANY');
  const [relationId, setRelationId] = useState('');
  const [content, setContent] = useState('');

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
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar referências de nota.');
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
    setRelationTypeFilter(allowedRelationType);
    setRelationIdFilter(allowedRelationType ? (params.get('relatedId')?.trim() ?? '') : '');
    setFiltersReady(true);
  }, [filtersReady, relationTypeOptions]);

  useEffect(() => {
    if (!filtersReady) {
      return;
    }
    void load(0, search, relationTypeFilter, relationIdFilter);
  }, [filtersReady, search, relationTypeFilter, relationIdFilter]);

  async function load(
    page: number,
    currentSearch: string,
    currentRelationType: CrmRelatedReferenceType | '',
    currentRelationId: string
  ) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listNotes(page, pageSize, currentSearch, {
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar notas.');
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

  function relationPayload(id: string) {
    return buildRelatedReferencePayload(relationType, id);
  }

  function resetForm() {
    setEditingId(null);
    setContent('');
    setRelationType('COMPANY');
    setRelationId('');
  }

  async function handleSubmit() {
    if (!content.trim() || !relationId) {
      setError('Conteúdo e vínculo são obrigatórios.');
      return;
    }

    const payload: CreateNoteInput | UpdateNoteInput = {
      content,
      ...relationPayload(relationId)
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await crmService.updateNote(editingId, payload as UpdateNoteInput);
      } else {
        await crmService.createNote(payload);
      }
      resetForm();
      await load(pageData.page, search, relationTypeFilter, relationIdFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar nota.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await crmService.deleteNote(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, relationTypeFilter, relationIdFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir nota.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmNote>[] = [
    { key: 'content', header: 'Conteúdo', render: (row) => row.content },
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
            <p className="font-medium text-[color:var(--app-shell-heading)]">{buildReferenceHeadline(relation, row.relatedDisplayName)}</p>
            <p className="text-xs text-[color:var(--app-shell-muted)]">{buildReferenceContextLine(relation, row.relatedId, row.relatedDisplayContext)}</p>
          </div>
        );
      }
    },
    { key: 'author', header: 'Autor', render: (row) => row.createdBy ?? row.authorUserId ?? '-' },
    { key: 'createdAt', header: 'Criada em', render: (row) => new Date(row.createdAt).toLocaleString('pt-BR') },
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
            <PermissionGuard permission="crm.note.update">
              {canEditRelation && editableRelation ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(row.id);
                    setContent(row.content);
                    setRelationType(editableRelation);
                    setRelationId(row.relatedId);
                  }}
                  className="ui-inline-button"
                >
                  Editar
                </button>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2 py-1 text-xs font-medium text-[color:var(--app-shell-muted)]">
                  Somente leitura
                </span>
              )}
            </PermissionGuard>
            <PermissionGuard permission="crm.note.delete">
              <button
                type="button"
                onClick={() => setDeleteCandidate(row)}
                className="ui-inline-danger-button"
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
      permission="crm.note.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar notas.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Notes" description="Notas rápidas com vínculo legível entre CRM e, quando permitido, entidades do PetFlow." />

        <div className="grid gap-3 ui-surface-panel p-4 xl:grid-cols-[1fr_180px_220px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Buscar por conteúdo da nota" />
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
          <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setRelationTypeFilter('');
              setRelationIdFilter('');
            }}
            className="ui-secondary-button"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'crm.note.update' : 'crm.note.create'}>
          <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormInput label="Conteúdo" value={content} onChange={setContent} required />
            <FormSelect label="Tipo de vínculo" value={relationType} options={relationTypeOptions} onChange={(value) => { setRelationType(value as CrmRelatedReferenceType); setRelationId(''); }} />
            <FormSelect label="Registro vinculado" value={relationId} options={[{ value: '', label: 'Selecione' }, ...relationOptions(relationType)]} onChange={setRelationId} />
            <p className="text-xs text-[color:var(--app-shell-muted)] md:col-span-2">
              Os vínculos CRM legados continuam compatíveis. Referências Pet aparecem quando o usuário possui leitura do recurso correspondente e são enviadas pelo tipo canônico.
            </p>
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                disabled={saving || !content.trim()}
                onClick={() => void handleSubmit()}
                className="ui-primary-button"
              >
                {editingId ? 'Salvar nota' : 'Criar nota'}
              </button>
              <button type="button" onClick={resetForm} className="ui-secondary-button">
                Cancelar
              </button>
            </div>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma nota encontrada." />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => void load(nextPage, search, relationTypeFilter, relationIdFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir nota"
          description={deleteCandidate ? `Confirma a exclusão desta nota?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
