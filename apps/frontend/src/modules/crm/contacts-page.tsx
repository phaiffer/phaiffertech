'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { CrmContact } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;
const statusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

const initialPage: PageResponse<CrmContact> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function CrmContactsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmContact>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listContacts(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar contatos.';
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
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setStatus('ACTIVE');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        status
      };

      if (editingId) {
        await crmService.updateContact(editingId, payload);
      } else {
        await crmService.createContact(payload);
      }

      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar contato.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(contact: CrmContact) {
    setEditingId(contact.id);
    setFirstName(contact.firstName);
    setLastName(contact.lastName ?? '');
    setEmail(contact.email ?? '');
    setPhone(contact.phone ?? '');
    setCompany(contact.company ?? '');
    setStatus(contact.status ?? 'ACTIVE');
  }

  async function handleDelete(contactId: string) {
    setError(null);
    try {
      await crmService.deleteContact(contactId);
      await load(pageData.page, search);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir contato.';
      setError(message);
    }
  }

  const columns: DataTableColumn<CrmContact>[] = [
      {
        key: 'name',
        header: 'Nome',
        render: (contact) => `${contact.firstName} ${contact.lastName ?? ''}`.trim()
      },
      {
        key: 'company',
        header: 'Empresa',
        render: (contact) => contact.company ?? '-'
      },
      {
        key: 'email',
        header: 'Email',
        render: (contact) => contact.email ?? '-'
      },
      {
        key: 'status',
        header: 'Status',
        render: (contact) => contact.status
      },
      {
        key: 'actions',
        header: 'Ações',
        render: (contact) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleEdit(contact)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(contact.id)}
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
        title="CRM Contacts"
        description="CRUD completo de contatos com paginação, busca e autorização por permissões."
      />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
        <FormInput label="Busca" value={searchInput} onChange={setSearchInput} placeholder="Nome, email, empresa" />
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
        <FormInput label="Nome" value={firstName} onChange={setFirstName} required />
        <FormInput label="Sobrenome" value={lastName} onChange={setLastName} />
        <FormInput label="Email" value={email} onChange={setEmail} type="email" />
        <FormInput label="Telefone" value={phone} onChange={setPhone} />
        <FormInput label="Empresa" value={company} onChange={setCompany} />
        <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
        <div className="flex items-end gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Salvando...' : editingId ? 'Atualizar contato' : 'Criar contato'}
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
        emptyMessage="Nenhum contato encontrado."
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
