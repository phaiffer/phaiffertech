'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreateCompanyInput, UpdateCompanyInput } from '@/shared/services/crm-service';
import { CrmCompany } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];
const formStatusOptions = statusOptions.filter((option) => option.value);
const initialPage: PageResponse<CrmCompany> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmCompaniesPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmCompany>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmCompany | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    void load(0, search, statusFilter);
  }, [search, statusFilter]);

  async function load(page: number, currentSearch: string, currentStatus: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listCompanies(page, pageSize, currentSearch, { status: currentStatus || undefined });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setLegalName('');
    setDocument('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setIndustry('');
    setStatus('ACTIVE');
  }

  function beginCreate() {
    resetForm();
    setError(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    resetForm();
    setIsEditorOpen(false);
  }

  async function handleSubmit() {
    const payload: CreateCompanyInput | UpdateCompanyInput = {
      name,
      legalName: legalName || undefined,
      document: document || undefined,
      email: email || undefined,
      phone: phone || undefined,
      website: website || undefined,
      industry: industry || undefined,
      status
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await crmService.updateCompany(editingId, payload as UpdateCompanyInput);
      } else {
        await crmService.createCompany(payload);
      }
      resetForm();
      setIsEditorOpen(false);
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar empresa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await crmService.deleteCompany(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir empresa.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmCompany>[] = [
    { key: 'name', header: 'Empresa', render: (row) => row.name },
    { key: 'document', header: 'Documento', render: (row) => row.document ?? '-' },
    { key: 'email', header: 'Email', render: (row) => row.email ?? '-' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <PermissionGuard permission="crm.company.update">
            <button
              type="button"
              onClick={() => {
                setEditingId(row.id);
                setName(row.name);
                setLegalName(row.legalName ?? '');
                setDocument(row.document ?? '');
                setEmail(row.email ?? '');
                setPhone(row.phone ?? '');
                setWebsite(row.website ?? '');
                setIndustry(row.industry ?? '');
                setStatus(row.status);
                setError(null);
                setIsEditorOpen(true);
              }}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="crm.company.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(row)}
              className="ui-inline-danger-button"
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
      permission="crm.company.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar empresas.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title="Companies"
          description="Keep the account base ready for contacts, leads, and deals."
          actions={(
            <PermissionGuard permission="crm.company.create">
              <button type="button" onClick={beginCreate} className="ui-primary-button">
                New company
              </button>
            </PermissionGuard>
          )}
        />

        <PageSection
          tone="muted"
          title="Filters"
          description="Search by company name, document, or lifecycle."
        >
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
            <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Nome, documento, email, site" />
            <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
            <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setStatusFilter('');
              }}
              className="ui-secondary-button"
            >
              Limpar
            </button>
          </div>
        </PageSection>

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'crm.company.update' : 'crm.company.create'}>
            <PageSection
              title={editingId ? 'Edit company' : 'New company'}
              description="Capture only the account details needed to keep CRM operations moving."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <FormInput label="Nome" value={name} onChange={setName} required />
                <FormInput label="Razão social" value={legalName} onChange={setLegalName} />
                <FormInput label="Documento" value={document} onChange={setDocument} />
                <FormInput label="Email" value={email} onChange={setEmail} type="email" />
                <FormInput label="Telefone" value={phone} onChange={setPhone} />
                <FormInput label="Website" value={website} onChange={setWebsite} />
                <FormInput label="Segmento" value={industry} onChange={setIndustry} />
                <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="button"
                    disabled={saving || !name.trim()}
                    onClick={() => void handleSubmit()}
                    className="ui-primary-button"
                  >
                    {editingId ? 'Salvar empresa' : 'Criar empresa'}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    Cancelar
                  </button>
                </div>
              </div>
            </PageSection>
          </PermissionGuard>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <PageSection
          title="Company directory"
          description="Account records that anchor the rest of the CRM."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} company(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Carregando empresas"
              loadingDescription="Preparando a lista de empresas do CRM."
              emptyState={{
                title: 'Nenhuma empresa registrada',
                description: 'Crie sua primeira empresa para iniciar a estrutura comercial e organizar a base do CRM.',
                action: (
                  <PermissionGuard permission="crm.company.create">
                    <button type="button" onClick={beginCreate} className="ui-primary-button">
                      Criar primeira empresa
                    </button>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search, statusFilter)} />
          </div>
        </PageSection>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir empresa"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
