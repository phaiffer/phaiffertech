'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreateDealInput, UpdateDealInput } from '@/shared/services/crm-service';
import { CrmCompany, CrmContact, CrmDeal, CrmLead, CrmPipelineStage } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
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
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];
const formStatusOptions = statusOptions.filter((option) => option.value);
const initialPage: PageResponse<CrmDeal> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmDealsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmDeal>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmDeal | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilterId, setCompanyFilterId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [status, setStatus] = useState('OPEN');
  const [companyId, setCompanyId] = useState('');
  const [pipelineStageId, setPipelineStageId] = useState('');
  const [contactId, setContactId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  useEffect(() => {
    void loadSupportingData();
  }, []);

  useEffect(() => {
    void load(0, search, statusFilter, companyFilterId);
  }, [search, statusFilter, companyFilterId]);

  async function loadSupportingData() {
    try {
      const [companiesPage, contactsPage, leadsPage, stagesPage] = await Promise.all([
        crmService.listCompanies(0, 100),
        crmService.listContacts(0, 100),
        crmService.listLeads(0, 100),
        crmService.listPipelineStages(0, 100)
      ]);
      setCompanies(resolvePageItems(companiesPage));
      setContacts(resolvePageItems(contactsPage));
      setLeads(resolvePageItems(leadsPage));
      setStages(resolvePageItems(stagesPage));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar opções de negócio.');
    }
  }

  async function load(page: number, currentSearch: string, currentStatus: string, currentCompanyId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listDeals(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        companyId: currentCompanyId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar negócios.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setAmount('');
    setCurrency('BRL');
    setStatus('OPEN');
    setCompanyId('');
    setPipelineStageId('');
    setContactId('');
    setLeadId('');
    setExpectedCloseDate('');
  }

  async function handleSubmit() {
    if (!companyId || !pipelineStageId || !title.trim()) {
      setError('Título, empresa e etapa são obrigatórios.');
      return;
    }

    const payload: CreateDealInput | UpdateDealInput = {
      title,
      description: description || undefined,
      amount: amount ? Number(amount) : undefined,
      currency,
      status,
      companyId,
      pipelineStageId,
      contactId: contactId || undefined,
      leadId: leadId || undefined,
      expectedCloseDate: expectedCloseDate || undefined
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await crmService.updateDeal(editingId, payload as UpdateDealInput);
      } else {
        await crmService.createDeal(payload);
      }
      resetForm();
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar negócio.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await crmService.deleteDeal(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir negócio.');
    }
  }

  const companyOptions = [{ value: '', label: 'Selecione' }, ...companies.map((item) => ({ value: item.id, label: item.name }))];
  const filterCompanyOptions = [{ value: '', label: 'Todas' }, ...companies.map((item) => ({ value: item.id, label: item.name }))];
  const stageOptions = [{ value: '', label: 'Selecione' }, ...stages.map((item) => ({ value: item.id, label: `${item.position}. ${item.name}` }))];
  const contactOptions = [{ value: '', label: 'Nenhum' }, ...contacts.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName ?? ''}`.trim() }))];
  const leadOptions = [{ value: '', label: 'Nenhum' }, ...leads.map((item) => ({ value: item.id, label: item.name }))];
  const companyName = (id?: string) => companies.find((item) => item.id === id)?.name ?? '-';
  const stageName = (id?: string) => stages.find((item) => item.id === id)?.name ?? '-';

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmDeal>[] = [
    { key: 'title', header: 'Negócio', render: (row) => row.title },
    { key: 'company', header: 'Empresa', render: (row) => companyName(row.companyId) },
    { key: 'stage', header: 'Etapa', render: (row) => stageName(row.pipelineStageId) },
    { key: 'amount', header: 'Valor', render: (row) => (row.amount ? `${row.currency} ${row.amount}` : '-') },
    { key: 'status', header: 'Status', render: (row) => row.status },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <PermissionGuard permission="crm.deal.update">
            <button
              type="button"
              onClick={() => {
                setEditingId(row.id);
                setTitle(row.title);
                setDescription(row.description ?? '');
                setAmount(row.amount ? String(row.amount) : '');
                setCurrency(row.currency);
                setStatus(row.status);
                setCompanyId(row.companyId);
                setPipelineStageId(row.pipelineStageId);
                setContactId(row.contactId ?? '');
                setLeadId(row.leadId ?? '');
                setExpectedCloseDate(row.expectedCloseDate ?? '');
              }}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="crm.deal.delete">
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
      permission="crm.deal.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar negócios.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Deals" description="Negócios vinculados a empresas e etapas do pipeline." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_220px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Título, descrição, moeda" />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FormSelect label="Empresa" value={companyFilterId} options={filterCompanyOptions} onChange={setCompanyFilterId} />
          <button type="button" onClick={() => setSearch(searchInput)} className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
              setCompanyFilterId('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'crm.deal.update' : 'crm.deal.create'}>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Título" value={title} onChange={setTitle} required />
            <FormInput label="Descrição" value={description} onChange={setDescription} />
            <FormInput label="Valor" value={amount} onChange={setAmount} type="number" />
            <FormInput label="Moeda" value={currency} onChange={setCurrency} />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <DateInput label="Previsão de fechamento" value={expectedCloseDate} onChange={setExpectedCloseDate} />
            <FormSelect label="Empresa" value={companyId} options={companyOptions} onChange={setCompanyId} />
            <FormSelect label="Etapa" value={pipelineStageId} options={stageOptions} onChange={setPipelineStageId} />
            <FormSelect label="Contato" value={contactId} options={contactOptions} onChange={setContactId} />
            <FormSelect label="Lead" value={leadId} options={leadOptions} onChange={setLeadId} />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                disabled={saving || !title.trim()}
                onClick={() => void handleSubmit()}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {editingId ? 'Salvar negócio' : 'Criar negócio'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Cancelar
              </button>
            </div>
          </div>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhum negócio encontrado." />

        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search, statusFilter, companyFilterId)} />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir negócio"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.title}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
