'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CrmCompany, CrmContact, CrmLead } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';

const pageSize = 10;
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'NEW', label: 'NEW' },
  { value: 'QUALIFIED', label: 'QUALIFIED' },
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];

const sourceOptions = [
  { value: '', label: 'Todas' },
  { value: 'WEBSITE', label: 'WEBSITE' },
  { value: 'EVENT', label: 'EVENT' },
  { value: 'REFERRAL', label: 'REFERRAL' }
];

const initialPage: PageResponse<CrmLead> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function CrmLeadsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmLead>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [companyFilterId, setCompanyFilterId] = useState('');
  const [contactFilterId, setContactFilterId] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<CrmLead | null>(null);

  useEffect(() => {
    let active = true;

    setLoadingCompanies(true);
    crmService.listCompanies(0, 100)
      .then((companiesPage) => {
        if (!active) {
          return;
        }
        setCompanies(resolvePageItems(companiesPage));
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar companies para filtro.';
        setError((current) => current ?? message);
      })
      .finally(() => {
        if (active) {
          setLoadingCompanies(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setLoadingContacts(true);
    crmService.listContacts(0, 100, '', {
      companyId: companyFilterId || undefined
    })
      .then((contactsPage) => {
        if (!active) {
          return;
        }
        setContacts(resolvePageItems(contactsPage));
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar contatos para filtro.';
        setError((current) => current ?? message);
      })
      .finally(() => {
        if (active) {
          setLoadingContacts(false);
        }
      });

    return () => {
      active = false;
    };
  }, [companyFilterId]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentSource: string,
    currentCompanyId: string,
    currentContactId: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listLeads(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        source: currentSource || undefined,
        companyId: currentCompanyId || undefined,
        contactId: currentContactId || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar leads.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search, statusFilter, sourceFilter, companyFilterId, contactFilterId);
  }, [companyFilterId, contactFilterId, load, search, sourceFilter, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await crmService.deleteLead(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, sourceFilter, companyFilterId, contactFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir lead.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const companyOptions = [
    { value: '', label: loadingCompanies ? 'Carregando companies...' : 'Todas as companies' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ];
  const contactOptions = [
    { value: '', label: loadingContacts ? 'Carregando contatos...' : 'Todos os contatos' },
    ...contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName ?? ''}`.trim()
    }))
  ];
  const companyName = (companyId?: string) => companies.find((company) => company.id === companyId)?.name ?? '-';
  const contactName = (contactId?: string) => {
    const contact = contacts.find((item) => item.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName ?? ''}`.trim() : '-';
  };
  const activeFilterCount = [search, statusFilter, sourceFilter, companyFilterId, contactFilterId].filter(Boolean).length;

  const columns: DataTableColumn<CrmLead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      render: (lead) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{lead.name}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {lead.email ?? 'Sem email'}
            {lead.phone ? ` • ${lead.phone}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'source',
      header: 'Origem',
      render: (lead) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{lead.source ?? 'Sem origem definida'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Atualizado em {formatDateTime(lead.updatedAt)}</p>
        </div>
      )
    },
    {
      key: 'relationship',
      header: 'Relacionamento',
      render: (lead) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{companyName(lead.companyId)}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Contato: {contactName(lead.contactId)}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => <StatusBadge status={lead.status} />
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (lead) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="crm.lead.update">
            <Link
              href={`/crm/leads/${lead.id}`}
              className="ui-inline-button"
            >
              Editar
            </Link>
          </PermissionGuard>

          <PermissionGuard permission="crm.lead.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(lead)}
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
      permission="crm.lead.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar leads.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title="Leads"
          description="Keep intake, source, and relationship context visible without turning the page into an admin panel."
          actions={(
            <PermissionGuard permission="crm.lead.create">
              <Link
                href="/crm/leads/new"
                className="ui-primary-button"
              >
                Novo lead
              </Link>
            </PermissionGuard>
          )}
        />

        <PageSection
          tone="muted"
          title="Filters"
          description="Refine the queue by status, source, company, and contact."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,0.82fr))] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Nome, email, origem"
              />
              <FormSelect
                label="Status"
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
              />
              <FormSelect
                label="Origem"
                value={sourceFilter}
                options={sourceOptions}
                onChange={setSourceFilter}
              />
              <FormSelect
                label="Company"
                value={companyFilterId}
                options={companyOptions}
                onChange={(value) => {
                  setCompanyFilterId(value);
                  setContactFilterId('');
                }}
                disabled={loadingCompanies}
              />
              <FormSelect
                label="Contato"
                value={contactFilterId}
                options={contactOptions}
                onChange={setContactFilterId}
                disabled={loadingContacts}
              />
            </div>
            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('');
                  setSourceFilter('');
                  setCompanyFilterId('');
                  setContactFilterId('');
                }}
                className="ui-secondary-button"
              >
                Limpar
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filtro(s) ativos na fila comercial.`
                  : 'Sem filtros ativos no momento.'}
              </p>
            </div>
          </div>
        </PageSection>

        {error ? (
          <div className="ui-notice-error">{error}</div>
        ) : null}

        <PageSection
          title="Lead queue"
          description="Open leads with source, relationship context, and next actions."
          actions={(
            <p className="text-sm text-[color:var(--app-shell-muted)]">
              Total {totalItems} lead(s)
            </p>
          )}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              emptyState={{
                title: 'Nenhum lead encontrado',
                description: 'Abra o primeiro lead para iniciar a fila comercial deste workspace.',
                action: (
                  <PermissionGuard permission="crm.lead.create">
                    <Link href="/crm/leads/new" className="ui-primary-button">
                      Novo lead
                    </Link>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(nextPage) => load(nextPage, search, statusFilter, sourceFilter, companyFilterId, contactFilterId)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir lead"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
