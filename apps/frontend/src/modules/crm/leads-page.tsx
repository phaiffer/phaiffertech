'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { CrmLead } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;
const statusOptions = [
  { value: 'NEW', label: 'NEW' },
  { value: 'QUALIFIED', label: 'QUALIFIED' },
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];

const initialPage: PageResponse<CrmLead> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function CrmLeadsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmLead>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('NEW');

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listLeads(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar leads.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search);
  }, [load, search]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setSource('');
    setStatus('NEW');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        source: source || undefined,
        status
      };

      if (editingId) {
        await crmService.updateLead(editingId, payload);
      } else {
        await crmService.createLead(payload);
      }

      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar lead.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(lead: CrmLead) {
    setEditingId(lead.id);
    setName(lead.name);
    setEmail(lead.email ?? '');
    setPhone(lead.phone ?? '');
    setSource(lead.source ?? '');
    setStatus(lead.status ?? 'NEW');
  }

  async function handleDelete(leadId: string) {
    setError(null);
    try {
      await crmService.deleteLead(leadId);
      await load(pageData.page, search);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir lead.';
      setError(message);
    }
  }

  const columns: DataTableColumn<CrmLead>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (lead) => lead.name
    },
    {
      key: 'source',
      header: 'Origem',
      render: (lead) => lead.source ?? '-'
    },
    {
      key: 'email',
      header: 'Email',
      render: (lead) => lead.email ?? '-'
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => lead.status
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (lead) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleEdit(lead)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(lead.id)}
            className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
          >
            Excluir
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <PageTitle
        title="CRM Leads"
        description="Gestão de leads com pipeline inicial de status, busca e paginação."
      />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
        <FormInput label="Busca" value={searchInput} onChange={setSearchInput} placeholder="Nome, email, origem" />
        <button
          type="button"
          onClick={() => setSearch(searchInput)}
          className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            setSearch('');
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Limpar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <FormInput label="Nome" value={name} onChange={setName} required />
        <FormInput label="Email" value={email} onChange={setEmail} type="email" />
        <FormInput label="Telefone" value={phone} onChange={setPhone} />
        <FormInput label="Origem" value={source} onChange={setSource} placeholder="Website, indicação, evento..." />
        <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
        <div className="flex items-end gap-2 md:col-span-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Salvando...' : editingId ? 'Atualizar lead' : 'Criar lead'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <DataTable
        columns={columns}
        rows={pageData.content}
        getRowKey={(row) => row.id}
        loading={loading}
        emptyMessage="Nenhum lead encontrado."
      />

      <Pagination
        page={pageData.page}
        totalPages={pageData.totalPages}
        totalElements={pageData.totalElements}
        onPageChange={(nextPage) => load(nextPage, search)}
      />
    </div>
  );
}
