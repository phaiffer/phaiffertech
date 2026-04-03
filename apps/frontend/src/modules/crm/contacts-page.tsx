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
import { crmService } from '@/shared/services/crm-service';
import { petClientContactSupportService } from '@/shared/services/pet-client-contact-support-service';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CrmCompany, CrmContact } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
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
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

const petStatusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' }
];

const initialPage: PageResponse<CrmContact> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type CrmContactsPageProps = {
  surface?: 'crm' | 'pet';
};

export function CrmContactsPage({ surface = 'crm' }: CrmContactsPageProps) {
  const isPetSurface = surface === 'pet';
  const contactService = isPetSurface ? petClientContactSupportService : crmService;
  const basePath = isPetSurface ? '/pet/clients/contacts' : '/crm/contacts';
  const [pageData, setPageData] = useState<PageResponse<CrmContact>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilterId, setCompanyFilterId] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<CrmContact | null>(null);

  useEffect(() => {
    if (isPetSurface) {
      setCompanies([]);
      setLoadingCompanies(false);
      return;
    }

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
        const message = err instanceof ApiClientError ? err.message : 'Unable to load companies for the contact filter.';
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
  }, [isPetSurface]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentCompanyId: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await contactService.listContacts(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        companyId: currentCompanyId || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : isPetSurface
          ? 'Nao foi possivel carregar os contatos de apoio.'
          : 'Unable to load CRM contacts.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [contactService, isPetSurface]);

  useEffect(() => {
    load(0, search, statusFilter, companyFilterId);
  }, [companyFilterId, load, search, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await contactService.deleteContact(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : isPetSurface
          ? 'Nao foi possivel remover o contato de apoio selecionado.'
          : 'Unable to delete the selected contact.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter, companyFilterId].filter(Boolean).length;
  const activeContactsOnPage = rows.filter((contact) => contact.status === 'ACTIVE').length;
  const contactsWithEmail = rows.filter((contact) => Boolean(contact.email)).length;
  const contactsWithPhone = rows.filter((contact) => Boolean(contact.phone)).length;
  const availableStatusOptions = isPetSurface ? petStatusOptions : statusOptions;
  const companyOptions = [
    { value: '', label: loadingCompanies ? 'Loading companies...' : 'All companies' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ];
  const summaryCards: DashboardSummaryCard[] = isPetSurface
    ? [
      {
        key: 'support-contacts-in-scope',
        label: 'Contatos de apoio',
        value: totalItems,
        trend: activeFilterCount > 0
          ? 'Os resultados refletem os filtros ativos deste diretorio.'
          : 'Base de contatos adicionais disponivel para a operacao PetFlow.'
      },
      {
        key: 'support-contacts-active-on-page',
        label: 'Ativos na pagina',
        value: activeContactsOnPage,
        trend: 'Registros visiveis prontos para apoiar recepcao, cobranca e follow-up.'
      },
      {
        key: 'support-contacts-with-email',
        label: 'Com e-mail',
        value: contactsWithEmail,
        trend: 'Cobertura de contato digital para responsaveis adicionais.'
      },
      {
        key: 'support-contacts-with-phone',
        label: 'Com telefone',
        value: contactsWithPhone,
        trend: 'Cobertura de telefone para recados operacionais e urgencias.'
      }
    ]
    : [
      {
        key: 'contacts-in-scope',
        label: 'Contacts in scope',
        value: totalItems,
        trend: activeFilterCount > 0
          ? 'Results reflect the active CRM filters.'
          : 'Full contact directory for this workspace.'
      },
      {
        key: 'active-contacts-on-page',
        label: 'Active on page',
        value: activeContactsOnPage,
        trend: 'Visible records currently marked active.'
      },
      {
        key: 'companies-loaded',
        label: 'Companies loaded',
        value: companies.length,
        trend: loadingCompanies
          ? 'Refreshing account context for the filter bar.'
          : 'Available account context for linking and filtering contacts.'
      },
      {
        key: 'contact-filters',
        label: 'Active filters',
        value: activeFilterCount,
        trend: activeFilterCount > 0
          ? 'The commercial view is narrowed to a focused segment.'
          : 'No filters are limiting the current view.'
      }
    ];

  const columns: DataTableColumn<CrmContact>[] = [
    {
      key: 'contact',
      header: isPetSurface ? 'Contato de apoio' : 'Contact',
      render: (contact) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {`${contact.firstName} ${contact.lastName ?? ''}`.trim()}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {contact.phone ?? (isPetSurface ? 'Sem telefone registrado' : 'No phone recorded')}
          </p>
        </div>
      )
    },
    {
      key: 'company',
      header: isPetSurface ? 'Contexto legado' : 'Company',
      render: (contact) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {contact.company ?? (isPetSurface ? 'Sem contexto legado' : 'Unlinked contact')}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {contact.companyId
              ? (isPetSurface ? 'Compatibilidade com company legado' : 'Linked to an account record')
              : (isPetSurface ? 'Gerenciado sem company herdada' : 'Managed without company context')}
          </p>
        </div>
      )
    },
    {
      key: 'email',
      header: isPetSurface ? 'Canal principal' : 'Primary email',
      render: (contact) => contact.email ?? (isPetSurface ? 'Sem e-mail registrado' : 'No email recorded')
    },
    {
      key: 'status',
      header: isPetSurface ? 'Disponibilidade' : 'Lifecycle',
      render: (contact) => <StatusBadge status={contact.status} />
    },
    {
      key: 'actions',
      header: isPetSurface ? 'Acoes' : 'Actions',
      render: (contact) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="crm.contact.update">
            <Link
              href={`${basePath}/${contact.id}`}
              className="ui-inline-button"
            >
              {isPetSurface ? 'Editar' : 'Edit'}
            </Link>
          </PermissionGuard>

          <PermissionGuard permission="crm.contact.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(contact)}
              className="ui-inline-danger-button"
            >
              {isPetSurface ? 'Remover' : 'Delete'}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="crm.contact.read"
      fallback={<div className="ui-notice-warning">{isPetSurface ? 'Voce nao possui permissao para visualizar contatos de apoio do PetFlow.' : 'You do not have permission to view CRM contacts.'}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow={isPetSurface ? 'PetFlow clients' : 'CRM workspace'}
          title={isPetSurface ? 'Contatos de apoio' : 'CRM Contacts'}
          description={isPetSurface
            ? 'Cadastre responsaveis adicionais, contatos financeiros ou apoios operacionais usados pela base de clientes do PetFlow. O contexto de company legado permanece apenas para compatibilidade.'
            : 'Commercial contact management with stronger filtering, clearer account context, and a more demo-ready first-use surface.'}
          actions={(
            <PermissionGuard permission="crm.contact.create">
              <Link
                href={`${basePath}/new`}
                className="ui-primary-button"
              >
                {isPetSurface ? 'Novo contato de apoio' : 'Add contact'}
              </Link>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title={isPetSurface ? 'Filtros de contatos de apoio' : 'Contact filters'}
          description={isPetSurface
            ? 'Refine o diretorio por nome, e-mail, telefone ou disponibilidade sem trazer o contexto legado para o centro da tela.'
            : 'Refine the relationship directory by search, lifecycle status, and account context without compressing the toolbar.'}
        >
          <div className={sharedFilterToolbarClass}>
            <div className={`grid gap-3 xl:items-end ${isPetSurface ? 'xl:grid-cols-[minmax(0,1.45fr)_220px]' : 'xl:grid-cols-[minmax(0,1.45fr)_220px_260px]'}`}>
              <SearchBar
                label={isPetSurface ? 'Buscar' : 'Search'}
                value={searchInput}
                onChange={setSearchInput}
                placeholder={isPetSurface ? 'Nome, e-mail ou telefone' : 'Name, email, phone, or company'}
              />
              <FormSelect
                label="Status"
                value={statusFilter}
                options={availableStatusOptions}
                onChange={setStatusFilter}
              />
              {!isPetSurface ? (
                <FormSelect
                  label="Company"
                  value={companyFilterId}
                  options={companyOptions}
                  onChange={setCompanyFilterId}
                  disabled={loadingCompanies}
                />
              ) : null}
            </div>

            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                {isPetSurface ? 'Buscar' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('');
                  setCompanyFilterId('');
                }}
                className="ui-secondary-button"
              >
                {isPetSurface ? 'Limpar' : 'Clear'}
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {isPetSurface
                  ? activeFilterCount > 0
                    ? `${activeFilterCount} filtro(s) ativos neste diretorio de apoio.`
                    : 'Sem filtros ativos. Mostrando a base mais ampla de contatos de apoio.'
                  : activeFilterCount > 0
                    ? `${activeFilterCount} active filter(s) shaping the CRM directory.`
                    : 'No active filters. Showing the broader contact base.'}
              </p>
            </div>

            {!isPetSurface && !loadingCompanies && companies.length === 0 ? (
              <div className="ui-notice-neutral">
                No companies are available for linking or filtering yet. You can still create standalone contacts and connect them later as account data grows.
              </div>
            ) : null}
          </div>
        </PageSection>

        {error ? (
          <div className="ui-notice-error">{error}</div>
        ) : null}

        <PageSection
          title={isPetSurface ? 'Diretorio de contatos de apoio' : 'Contact directory'}
          description={isPetSurface
            ? 'Esta lista concentra contatos adicionais que apoiam recepcao, cobranca e continuidade do relacionamento no PetFlow.'
            : 'The table keeps people, account context, and action controls readable during demos, onboarding, and day-to-day CRM follow-up.'}
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">{isPetSurface ? `Total de ${totalItems} contato(s)` : `Total ${totalItems} contact(s)`}</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle={isPetSurface ? 'Carregando contatos de apoio' : 'Loading contacts'}
              loadingDescription={isPetSurface
                ? 'Preparando o diretorio de contatos adicionais com compatibilidade legada preservada.'
                : 'Preparing the CRM contact directory with account context and lifecycle signals.'}
              emptyState={{
                title: isPetSurface ? 'Nenhum contato de apoio encontrado' : 'No contacts found',
                description: isPetSurface
                  ? activeFilterCount > 0
                    ? 'Ajuste os filtros ou cadastre um novo contato para ampliar a cobertura do cliente.'
                    : 'Cadastre o primeiro contato de apoio para registrar responsaveis adicionais, financeiros ou de contingencia.'
                  : activeFilterCount > 0
                    ? 'Adjust the filters or add a new contact to keep the commercial workspace moving.'
                    : 'Create the first contact to start building the relationship base for this CRM workspace.',
                action: (
                  <PermissionGuard permission="crm.contact.create">
                    <Link href={`${basePath}/new`} className="ui-primary-button">
                      {isPetSurface ? 'Criar primeiro contato de apoio' : 'Create first contact'}
                    </Link>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(nextPage) => load(nextPage, search, statusFilter, companyFilterId)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={isPetSurface ? 'Remover contato de apoio' : 'Delete contact'}
          description={deleteCandidate
            ? (isPetSurface
              ? `Remover ${deleteCandidate.firstName} do diretorio de contatos de apoio?`
              : `Delete ${deleteCandidate.firstName} from the CRM directory?`)
            : undefined}
          confirmLabel={isPetSurface ? 'Remover' : 'Delete'}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
