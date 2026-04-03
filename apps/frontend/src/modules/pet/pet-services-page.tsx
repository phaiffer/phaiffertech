'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
import { PetServiceCatalog, PetServiceCategory } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import {
  describePetServiceCatalogItem,
  formatPetServiceCategory,
  resolveAllowedPetServiceCategories
} from '@/modules/pet/pet-service-catalog-policy';

const pageSize = 10;

const initialPage: PageResponse<PetServiceCatalog> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function ServiceFlagToggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[color:var(--app-shell-border)]"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-[color:var(--app-shell-heading)]">{label}</span>
        <span className="block text-xs leading-5 text-[color:var(--app-shell-muted)]">{description}</span>
      </span>
    </label>
  );
}

export function PetServicesPage() {
  const platform = useFrontendPlatform();
  const allowedCategories = useMemo(
    () => resolveAllowedPetServiceCategories(platform.user),
    [platform.user]
  );
  const defaultCategory = allowedCategories[0] ?? 'GROOMING';

  const [pageData, setPageData] = useState<PageResponse<PetServiceCatalog>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PetServiceCategory>(defaultCategory);
  const [active, setActive] = useState(true);
  const [basePrice, setBasePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [commissionEligible, setCommissionEligible] = useState(true);
  const [allowInPlans, setAllowInPlans] = useState(true);
  const [allowStandaloneBooking, setAllowStandaloneBooking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetServiceCatalog | null>(null);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentCategoryFilter: string,
    currentActiveFilter: 'all' | 'active' | 'inactive'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listServices(page, pageSize, currentSearch, {
        category: currentCategoryFilter ? currentCategoryFilter as PetServiceCategory : undefined,
        active: currentActiveFilter === 'all' ? undefined : currentActiveFilter === 'active'
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load PetFlow services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, search, categoryFilter, activeFilter);
  }, [activeFilter, categoryFilter, load, search]);

  useEffect(() => {
    if (editingId) {
      return;
    }

    if (!allowedCategories.includes(category)) {
      setCategory(defaultCategory);
    }
  }, [allowedCategories, category, defaultCategory, editingId]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setCategory(defaultCategory);
    setActive(true);
    setBasePrice('');
    setDurationMinutes('60');
    setCommissionEligible(true);
    setAllowInPlans(true);
    setAllowStandaloneBooking(true);
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
    setCategory(item.category);
    setActive(item.active);
    setBasePrice(String(item.basePrice));
    setDurationMinutes(String(item.durationMinutes));
    setCommissionEligible(item.commissionEligible);
    setAllowInPlans(item.allowInPlans);
    setAllowStandaloneBooking(item.allowStandaloneBooking);
    setError(null);
    setSuccess(null);
    scrollToServiceForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedBasePrice = Number(basePrice);
    const parsedDuration = Number(durationMinutes);
    if (Number.isNaN(parsedBasePrice) || Number.isNaN(parsedDuration) || parsedDuration < 1) {
      setError('Enter a valid base price and duration.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        description: description || undefined,
        category,
        active,
        basePrice: parsedBasePrice,
        durationMinutes: parsedDuration,
        commissionEligible,
        allowInPlans,
        allowStandaloneBooking
      };

      if (editingId) {
        await petService.updateService(editingId, payload);
        setSuccess('Service updated successfully.');
      } else {
        await petService.createService(payload);
        setSuccess('Service created successfully.');
      }

      resetForm();
      await load(pageData.page, search, categoryFilter, activeFilter);
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
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected service.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, categoryFilter, activeFilter !== 'all' ? activeFilter : ''].filter(Boolean).length;
  const activeServices = rows.filter((item) => item.active).length;
  const planReadyServices = rows.filter((item) => item.allowInPlans).length;
  const averageDuration = rows.length > 0
    ? Math.round(rows.reduce((total, item) => total + item.durationMinutes, 0) / rows.length)
    : 0;
  const averageBasePrice = rows.length > 0
    ? Math.round(rows.reduce((total, item) => total + item.basePrice, 0) / rows.length)
    : 0;

  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'services-in-scope',
      label: 'Services in scope',
      value: totalItems,
      trend: activeFilterCount > 0
        ? 'Results reflect the current scheduling filter mix.'
        : 'Full service catalog visible for this workspace.'
    },
    {
      key: 'active-services',
      label: 'Active services',
      value: activeServices,
      trend: 'Only active definitions can be used for new appointments.'
    },
    {
      key: 'plan-ready-services',
      label: 'Plan-ready services',
      value: planReadyServices,
      trend: 'Useful for recurring packages and plan-linked scheduling.'
    },
    {
      key: 'average-service-duration',
      label: 'Avg duration (min)',
      value: averageDuration,
      trend: `Visible base price average: BRL ${averageBasePrice}.`
    }
  ];

  const categoryOptions = allowedCategories.map((value) => ({
    value,
    label: formatPetServiceCategory(value)
  }));

  const filterCategoryOptions = [
    { value: '', label: 'All categories' },
    ...categoryOptions
  ];

  const activeFilterOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active only' },
    { value: 'inactive', label: 'Inactive only' }
  ];

  const columns: DataTableColumn<PetServiceCatalog>[] = [
    {
      key: 'service',
      header: 'Service',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {item.description ?? 'No service summary recorded yet.'}
          </p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">{formatPetServiceCategory(item.category)}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {item.active ? 'Active for new bookings' : 'Inactive for new bookings'}
          </p>
        </div>
      )
    },
    {
      key: 'basePrice',
      header: 'Base price',
      render: (item) => item.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (item) => `${item.durationMinutes} min`
    },
    {
      key: 'bookingRules',
      header: 'Booking rules',
      render: (item) => (
        <div className="space-y-1 text-xs text-[color:var(--app-shell-muted)]">
          <p>{item.allowStandaloneBooking ? 'Standalone booking enabled' : 'Requires plan linkage'}</p>
          <p>{item.allowInPlans ? 'Eligible for plan sessions' : 'One-time scheduling only'}</p>
          <p>{item.commissionEligible ? 'Commission eligible' : 'Commission excluded'}</p>
        </div>
      )
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
          description="Define grooming and clinical services with enough structure for scheduling, base pricing, duration, plans, and future operational links."
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
          description="Refine the tenant-owned service catalog by search, category, and operational status."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(0,0.9fr))] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Service name or summary"
              />
              <FormSelect
                label="Category"
                value={categoryFilter}
                options={filterCategoryOptions}
                onChange={setCategoryFilter}
              />
              <FormSelect
                label="Status"
                value={activeFilter}
                options={activeFilterOptions}
                onChange={(value) => setActiveFilter(value as 'all' | 'active' | 'inactive')}
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
                  setCategoryFilter('');
                  setActiveFilter('all');
                }}
                className="ui-secondary-button"
              >
                Clear
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? 'The catalog is narrowed to a more operationally relevant slice.'
                  : 'No filters are active. Showing the broader service mix.'}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'pet.service.update' : 'pet.service.create'}>
          <div id="pet-service-form-section">
            <PageSection
              title={editingId ? 'Edit service' : 'Create service'}
              description="Capture the structured definition the schedule needs: category, status, duration, base price, plan eligibility, and commission behavior."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label="Name" value={name} onChange={setName} required />
                  <FormSelect label="Category" value={category} options={categoryOptions} onChange={(value) => setCategory(value as PetServiceCategory)} />
                  <FormInput label="Base price" value={basePrice} onChange={setBasePrice} type="number" required />
                  <FormInput label="Duration (min)" value={durationMinutes} onChange={setDurationMinutes} type="number" required />
                  <FormInput label="Description" value={description} onChange={setDescription} wrapperClassName="xl:col-span-2" />
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  <ServiceFlagToggle
                    label="Active for scheduling"
                    description="Inactive services remain historical records but stop being available for new bookings."
                    checked={active}
                    onChange={setActive}
                  />
                  <ServiceFlagToggle
                    label="Commission eligible"
                    description="Keeps the service ready for the next safe commission rollout without hard-coding exceptions later."
                    checked={commissionEligible}
                    onChange={setCommissionEligible}
                  />
                  <ServiceFlagToggle
                    label="Allowed in plans"
                    description="Enable this when the base service can be covered by recurring plans or prepaid session packs."
                    checked={allowInPlans}
                    onChange={setAllowInPlans}
                  />
                  <ServiceFlagToggle
                    label="Allowed as standalone booking"
                    description="Disable this when the service should only be booked as part of a plan or structured follow-up package."
                    checked={allowStandaloneBooking}
                    onChange={setAllowStandaloneBooking}
                  />
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
          description="Keep the catalog easy to scan while making each definition useful for scheduling, plans, pricing, and operational follow-up."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} service(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Loading services"
              loadingDescription="Preparing the service catalog with category, booking, and pricing context."
              emptyState={{
                title: 'No services found',
                description: activeFilterCount > 0
                  ? 'Adjust the filters or add a service to keep the catalog ready for appointments and demos.'
                  : 'Create the first service definition to make scheduling and plans feel structured.',
                action: (
                  <PermissionGuard permission="pet.service.create">
                    <button type="button" onClick={beginCreateService} className="ui-primary-button">
                      Create first service
                    </button>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(page) => void load(page, search, categoryFilter, activeFilter)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Delete service?"
          description={deleteCandidate ? `The service "${describePetServiceCatalogItem(deleteCandidate, 'pt-BR')}" will be removed from the catalog.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
