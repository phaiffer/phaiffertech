'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
import { PetServiceCatalog } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<PetServiceCatalog> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function PetServicesPage() {
  const [pageData, setPageData] = useState<PageResponse<PetServiceCatalog>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetServiceCatalog | null>(null);

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listServices(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load PetFlow services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, search);
  }, [load, search]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setDurationMinutes('60');
  }

  function scrollToServiceForm() {
    document.getElementById('pet-service-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function beginCreateService() {
    resetForm();
    scrollToServiceForm();
  }

  function beginEdit(item: PetServiceCatalog) {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description ?? '');
    setPrice(String(item.price));
    setDurationMinutes(String(item.durationMinutes));
    setError(null);
    setSuccess(null);
    scrollToServiceForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    const parsedDuration = Number(durationMinutes);
    if (Number.isNaN(parsedPrice) || Number.isNaN(parsedDuration) || parsedDuration < 1) {
      setError('Enter a valid price and duration.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        description: description || undefined,
        price: parsedPrice,
        durationMinutes: parsedDuration
      };

      if (editingId) {
        await petService.updateService(editingId, payload);
        setSuccess('Service updated successfully.');
      } else {
        await petService.createService(payload);
        setSuccess('Service created successfully.');
      }

      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save the service.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteService(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Service removed successfully.');
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected service.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search].filter(Boolean).length;
  const averagePrice = rows.length > 0
    ? Math.round(rows.reduce((total, item) => total + item.price, 0) / rows.length)
    : 0;
  const averageDuration = rows.length > 0
    ? Math.round(rows.reduce((total, item) => total + item.durationMinutes, 0) / rows.length)
    : 0;
  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'services-in-scope',
      label: 'Services in scope',
      value: totalItems,
      trend: activeFilterCount > 0
        ? 'Results reflect the current search.'
        : 'Full service catalog for this workspace.'
    },
    {
      key: 'average-service-price',
      label: 'Avg price (BRL)',
      value: averagePrice,
      trend: 'Average price across the visible service mix.'
    },
    {
      key: 'average-service-duration',
      label: 'Avg duration (min)',
      value: averageDuration,
      trend: 'Useful for demoing scheduling and service packaging.'
    },
    {
      key: 'service-filters',
      label: 'Active filters',
      value: activeFilterCount,
      trend: activeFilterCount > 0
        ? 'The catalog is narrowed to a focused search.'
        : 'No filters are limiting the current view.'
    }
  ];

  const columns: DataTableColumn<PetServiceCatalog>[] = [
    {
      key: 'service',
      header: 'Service',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{item.description ?? 'No service summary recorded yet'}</p>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (item) => `${item.durationMinutes} min`
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.service.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.service.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              Delete
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.service.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view PetFlow services.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Pet Services"
          description="A cleaner, more commercially ready service catalog for grooming, clinic, and onboarding demos."
          actions={(
            <PermissionGuard permission="pet.service.create">
              <button type="button" onClick={beginCreateService} className="ui-primary-button">
                Add service
              </button>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title="Service filters"
          description="Refine the service catalog without collapsing the page into a narrow search toolbar."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Service name or summary"
              />
            </div>
            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                }}
                className="ui-secondary-button"
              >
                Clear
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? 'Search is narrowing the catalog for a focused conversation.'
                  : 'No filters are active. Showing the broader service mix.'}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'pet.service.update' : 'pet.service.create'}>
          <div id="pet-service-form-section">
            <PageSection
              title={editingId ? 'Edit service' : 'Create service'}
              description="Package the core information needed for appointments, pricing conversations, and first-use demos in one balanced form."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label="Name" value={name} onChange={setName} required />
                  <FormInput label="Price" value={price} onChange={setPrice} type="number" required />
                  <FormInput label="Service summary" value={description} onChange={setDescription} />
                  <FormInput label="Duration (min)" value={durationMinutes} onChange={setDurationMinutes} type="number" required />
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update service' : 'Create service'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="ui-secondary-button"
                  >
                    {editingId ? 'Cancel edit' : 'Reset form'}
                  </button>
                </div>
              </form>
            </PageSection>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          title="Service catalog"
          description="The list keeps services easy to scan during demos while still supporting quick operational edits."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} service(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Loading services"
              loadingDescription="Preparing the service catalog with price and duration context."
              emptyState={{
                title: 'No services found',
                description: activeFilterCount > 0
                  ? 'Adjust the search or add a service to keep the catalog ready for appointments and demos.'
                  : 'Create the first service to make scheduling and service packaging feel complete.',
                action: (
                  <PermissionGuard permission="pet.service.create">
                    <button type="button" onClick={beginCreateService} className="ui-primary-button">
                      Create first service
                    </button>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(page) => void load(page, search)} />
          </div>
        </PageSection>

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Delete service?"
          description={deleteCandidate ? `The service "${deleteCandidate.name}" will be removed from the catalog.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
