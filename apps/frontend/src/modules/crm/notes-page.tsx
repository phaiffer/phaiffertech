'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreateNoteInput, UpdateNoteInput } from '@/shared/services/crm-service';
import { CrmCompany, CrmContact, CrmDeal, CrmLead, CrmNote } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;
const relationTypeOptions = [
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'CONTACT', label: 'Contato' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEAL', label: 'Negócio' }
];
const initialPage: PageResponse<CrmNote> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmNotesPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmNote>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmNote | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [relationType, setRelationType] = useState('COMPANY');
  const [relationId, setRelationId] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    void loadSupportingData();
  }, []);

  useEffect(() => {
    void load(0, search);
  }, [search]);

  async function loadSupportingData() {
    try {
      const [companiesPage, contactsPage, leadsPage, dealsPage] = await Promise.all([
        crmService.listCompanies(0, 100),
        crmService.listContacts(0, 100),
        crmService.listLeads(0, 100),
        crmService.listDeals(0, 100)
      ]);
      setCompanies(resolvePageItems(companiesPage));
      setContacts(resolvePageItems(contactsPage));
      setLeads(resolvePageItems(leadsPage));
      setDeals(resolvePageItems(dealsPage));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar opções de nota.');
    }
  }

  async function load(page: number, currentSearch: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listNotes(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar notas.');
    } finally {
      setLoading(false);
    }
  }

  function relationOptions() {
    switch (relationType) {
      case 'CONTACT':
        return contacts.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName ?? ''}`.trim() }));
      case 'LEAD':
        return leads.map((item) => ({ value: item.id, label: item.name }));
      case 'DEAL':
        return deals.map((item) => ({ value: item.id, label: item.title }));
      case 'COMPANY':
      default:
        return companies.map((item) => ({ value: item.id, label: item.name }));
    }
  }

  function relationPayload(id: string) {
    return {
      companyId: relationType === 'COMPANY' ? id : undefined,
      contactId: relationType === 'CONTACT' ? id : undefined,
      leadId: relationType === 'LEAD' ? id : undefined,
      dealId: relationType === 'DEAL' ? id : undefined
    };
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
      await load(pageData.page, search);
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
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir nota.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmNote>[] = [
    { key: 'content', header: 'Conteúdo', render: (row) => row.content },
    { key: 'relation', header: 'Vínculo', render: (row) => `${row.relatedType} ${row.relatedId.slice(0, 8)}` },
    { key: 'author', header: 'Autor', render: (row) => row.createdBy ?? row.authorUserId ?? '-' },
    { key: 'createdAt', header: 'Criada em', render: (row) => new Date(row.createdAt).toLocaleString('pt-BR') },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <PermissionGuard permission="crm.note.update">
            <button
              type="button"
              onClick={() => {
                setEditingId(row.id);
                setContent(row.content);
                setRelationType(row.relatedType);
                setRelationId(row.relatedId);
              }}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="crm.note.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(row)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="crm.note.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar notas.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Notes" description="Notas rápidas vinculadas aos registros do CRM." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Buscar por conteúdo da nota" />
          <button type="button" onClick={() => setSearch(searchInput)} className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
            Buscar
          </button>
          <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'crm.note.update' : 'crm.note.create'}>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Conteúdo" value={content} onChange={setContent} required />
            <FormSelect label="Tipo de vínculo" value={relationType} options={relationTypeOptions} onChange={(value) => { setRelationType(value); setRelationId(''); }} />
            <FormSelect label="Registro vinculado" value={relationId} options={[{ value: '', label: 'Selecione' }, ...relationOptions()]} onChange={setRelationId} />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                disabled={saving || !content.trim()}
                onClick={() => void handleSubmit()}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {editingId ? 'Salvar nota' : 'Criar nota'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Cancelar
              </button>
            </div>
          </div>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma nota encontrada." />

        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search)} />

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
