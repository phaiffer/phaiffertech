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
import { PetProduct, PetServiceCatalog, PetServiceCategory } from '@/shared/types/pet';
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
  resolveAllowedPetServiceCategories,
  resolvePetServiceBookingMode
} from '@/modules/pet/pet-service-catalog-policy';

const pageSize = 10;

const initialPage: PageResponse<PetServiceCatalog> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type ServiceInventoryLinkFormState = {
  inventoryItemId: string;
  inventoryItemName?: string;
  inventoryItemSku?: string | null;
  unitOfMeasure?: string;
  expectedQuantity: string;
  consumptionRule: 'FIXED_PER_SERVICE';
  active: boolean;
};

const defaultInventoryRule: ServiceInventoryLinkFormState['consumptionRule'] = 'FIXED_PER_SERVICE';

function formatExpectedQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

function formatInventoryLinkSummary(service: Pick<PetServiceCatalog, 'inventoryLinks'>) {
  const activeLinks = service.inventoryLinks.filter((link) => link.active);
  if (activeLinks.length === 0) {
    return 'No planned stock usage';
  }

  const preview = activeLinks
    .slice(0, 2)
    .map((link) => `${link.inventoryItemName} x${formatExpectedQuantity(link.expectedQuantity)} ${link.unitOfMeasure}`)
    .join(' • ');

  return activeLinks.length > 2
    ? `${preview} • +${activeLinks.length - 2} more`
    : preview;
}

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

function buildServiceAvailabilityLabel(service: Pick<PetServiceCatalog, 'allowInPlans' | 'allowStandaloneBooking'>) {
  switch (resolvePetServiceBookingMode(service)) {
    case 'PLAN_ONLY':
      return 'Plan sessions only';
    case 'STANDALONE_ONLY':
      return 'Standalone booking only';
    case 'UNAVAILABLE':
      return 'Unavailable for new scheduling';
    default:
      return 'Standalone booking and plan sessions enabled';
  }
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
  const [products, setProducts] = useState<PetProduct[]>([]);
  const [productsLookupError, setProductsLookupError] = useState<string | null>(null);

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
  const [inventoryLinks, setInventoryLinks] = useState<ServiceInventoryLinkFormState[]>([]);
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

  const loadProducts = useCallback(async () => {
    try {
      const result = await petService.listProducts(0, 200, '');
      setProducts(resolvePageItems(result));
      setProductsLookupError(null);
    } catch (err) {
      setProducts([]);
      setProductsLookupError(err instanceof ApiClientError ? err.message : 'Unable to load products for inventory linking.');
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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
    setInventoryLinks([]);
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
    setInventoryLinks(item.inventoryLinks.map((link) => ({
      inventoryItemId: link.inventoryItemId,
      inventoryItemName: link.inventoryItemName,
      inventoryItemSku: link.inventoryItemSku ?? undefined,
      unitOfMeasure: link.unitOfMeasure,
      expectedQuantity: formatExpectedQuantity(link.expectedQuantity),
      consumptionRule: link.consumptionRule,
      active: link.active
    })));
    setError(null);
    setSuccess(null);
    scrollToServiceForm();
  }

  function handleAddInventoryLink() {
    setInventoryLinks((current) => [
      ...current,
      {
        inventoryItemId: '',
        expectedQuantity: '1',
        consumptionRule: defaultInventoryRule,
        active: true
      }
    ]);
  }

  function handleInventoryLinkChange(
    index: number,
    updates: Partial<ServiceInventoryLinkFormState>
  ) {
    setInventoryLinks((current) => current.map((link, currentIndex) => {
      if (currentIndex !== index) {
        return link;
      }

      const next = { ...link, ...updates };
      if (updates.inventoryItemId !== undefined) {
        const selectedProduct = products.find((product) => product.inventoryItemId === updates.inventoryItemId);
        next.inventoryItemName = selectedProduct?.name ?? link.inventoryItemName;
        next.inventoryItemSku = selectedProduct?.sku ?? link.inventoryItemSku;
        next.unitOfMeasure = selectedProduct?.unitOfMeasure ?? link.unitOfMeasure;
      }
      return next;
    }));
  }

  function handleRemoveInventoryLink(index: number) {
    setInventoryLinks((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedBasePrice = Number(basePrice);
    const parsedDuration = Number(durationMinutes);
    if (Number.isNaN(parsedBasePrice) || Number.isNaN(parsedDuration) || parsedDuration < 1) {
      setError('Enter a valid base price and duration.');
      return;
    }

    if (active && !allowInPlans && !allowStandaloneBooking) {
      setError('Active services must allow standalone booking or plan-based scheduling.');
      return;
    }

    const parsedInventoryLinks = inventoryLinks.map((link) => ({
      ...link,
      expectedQuantityNumber: Number(link.expectedQuantity)
    }));

    if (parsedInventoryLinks.some((link) => !link.inventoryItemId || Number.isNaN(link.expectedQuantityNumber) || link.expectedQuantityNumber <= 0)) {
      setError('Select an inventory item and enter a positive quantity for every linked recipe line.');
      return;
    }

    const selectedInventoryIds = parsedInventoryLinks.map((link) => link.inventoryItemId);
    if (new Set(selectedInventoryIds).size !== selectedInventoryIds.length) {
      setError('A service recipe cannot repeat the same inventory item.');
      return;
    }

    setSubmitting(true);

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
        allowStandaloneBooking,
        inventoryLinks: parsedInventoryLinks.map((link) => ({
          inventoryItemId: link.inventoryItemId,
          expectedQuantity: link.expectedQuantityNumber,
          consumptionRule: link.consumptionRule,
          active: link.active
        }))
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
  const parsedDraftBasePrice = Number(basePrice);
  const parsedDraftDuration = Number(durationMinutes);
  const activeSchedulingConflict = active && !allowInPlans && !allowStandaloneBooking;
  const inventoryOptions = useMemo(() => {
    const knownOptions = products.map((product) => ({
      value: product.inventoryItemId,
      label: `${product.name} (${product.sku})`
    }));
    const fallbackOptions = inventoryLinks
      .filter((link) => link.inventoryItemId && !products.some((product) => product.inventoryItemId === link.inventoryItemId))
      .map((link) => ({
        value: link.inventoryItemId,
        label: link.inventoryItemName
          ? (link.inventoryItemSku ? `${link.inventoryItemName} (${link.inventoryItemSku})` : link.inventoryItemName)
          : `Linked item ${link.inventoryItemId}`
      }));

    return [
      { value: '', label: 'Select an inventory item' },
      ...knownOptions,
      ...fallbackOptions
    ];
  }, [inventoryLinks, products]);
  const activeInventoryLinks = inventoryLinks.filter((link) => link.inventoryItemId && link.active);
  const inventoryPreview = activeInventoryLinks.length > 0
    ? activeInventoryLinks
      .map((link) => {
        const itemLabel = link.inventoryItemName
          ?? products.find((product) => product.inventoryItemId === link.inventoryItemId)?.name
          ?? 'Linked inventory item';
        const unit = link.unitOfMeasure
          ?? products.find((product) => product.inventoryItemId === link.inventoryItemId)?.unitOfMeasure
          ?? 'UNIT';
        return `${itemLabel} x${link.expectedQuantity || '0'} ${unit}`;
      })
      .join(' • ')
    : 'No planned inventory consumption.';
  const draftServicePreview = describePetServiceCatalogItem({
    id: editingId ?? 'draft-service',
    name: name.trim() || 'Draft service',
    description: description.trim() || undefined,
    category,
    active,
    basePrice: Number.isFinite(parsedDraftBasePrice) ? parsedDraftBasePrice : 0,
    durationMinutes: Number.isFinite(parsedDraftDuration) && parsedDraftDuration > 0 ? parsedDraftDuration : 0,
    commissionEligible,
    allowInPlans,
    allowStandaloneBooking,
    inventoryLinks: [],
    createdAt: '',
    updatedAt: ''
  }, 'en-US');
  const draftAvailabilityLabel = buildServiceAvailabilityLabel({ allowInPlans, allowStandaloneBooking });

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
      key: 'inventoryRecipe',
      header: 'Inventory recipe',
      render: (item) => (
        <div className="space-y-1 text-xs text-[color:var(--app-shell-muted)]">
          <p className="font-medium text-slate-900">
            {item.inventoryLinks.filter((link) => link.active).length} active linked item(s)
          </p>
          <p>{formatInventoryLinkSummary(item)}</p>
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

                <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Inventory recipe
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
                        Link the products or materials this service is expected to consume. This first step is read-only and keeps current stock flows stable.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddInventoryLink}
                      disabled={Boolean(productsLookupError)}
                      className="ui-secondary-button"
                    >
                      Add linked item
                    </button>
                  </div>

                  {productsLookupError ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {productsLookupError}
                    </div>
                  ) : null}

                  {inventoryLinks.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {inventoryLinks.map((link, index) => (
                        <div
                          key={`${link.inventoryItemId || 'draft'}-${index}`}
                          className="rounded-xl border border-[color:var(--app-shell-border)] bg-white/80 px-3 py-3"
                        >
                          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_180px_auto] xl:items-end">
                            <FormSelect
                              label="Inventory item"
                              value={link.inventoryItemId}
                              options={inventoryOptions}
                              onChange={(value) => handleInventoryLinkChange(index, { inventoryItemId: value })}
                              disabled={Boolean(productsLookupError)}
                            />
                            <FormInput
                              label="Qty per service"
                              value={link.expectedQuantity}
                              onChange={(value) => handleInventoryLinkChange(index, { expectedQuantity: value })}
                              type="number"
                              step="0.01"
                              min="0.01"
                            />
                            <div className="flex gap-2 xl:justify-end">
                              <label className="flex items-center gap-2 text-sm text-[color:var(--app-shell-muted)]">
                                <input
                                  type="checkbox"
                                  checked={link.active}
                                  onChange={(event) => handleInventoryLinkChange(index, { active: event.target.checked })}
                                  className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                                />
                                Active
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveInventoryLink(index)}
                                className="ui-inline-button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-[color:var(--app-shell-muted)]">
                            {link.inventoryItemName
                              ? `${link.inventoryItemName}${link.inventoryItemSku ? ` (${link.inventoryItemSku})` : ''}`
                              : 'Pick a product or material from the current inventory catalog.'}
                            {link.unitOfMeasure ? ` • Unit ${link.unitOfMeasure}` : ''}
                            {link.active ? ' • Visible in appointment consumption previews.' : ' • Stored but hidden from appointment previews until reactivated.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[color:var(--app-shell-muted)]">
                      Leave this empty for services that do not need planned stock visibility yet.
                    </p>
                  )}
                </div>

                <div className={`rounded-2xl border px-4 py-3 ${
                  activeSchedulingConflict
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)]'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                    Scheduling preview
                  </p>
                  <p className="mt-2 text-sm font-medium text-[color:var(--app-shell-heading)]">
                    {draftServicePreview}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-[color:var(--app-shell-muted)] xl:grid-cols-2">
                    <p>Category: {formatPetServiceCategory(category)}</p>
                    <p>Status: {active ? 'Active for new appointments' : 'Hidden from new appointments'}</p>
                    <p>Scheduling mode: {draftAvailabilityLabel}</p>
                    <p>{commissionEligible ? 'Commission ready' : 'Commission excluded'}</p>
                    <p className="xl:col-span-2">Inventory preview: {inventoryPreview}</p>
                  </div>
                  <p className={`mt-3 text-xs ${activeSchedulingConflict ? 'text-amber-800' : 'text-[color:var(--app-shell-muted)]'}`}>
                    {activeSchedulingConflict
                      ? 'Active services need at least one booking path enabled so operators can actually schedule them.'
                      : active
                        ? 'This preview matches how the service will appear in the structured appointment picker.'
                        : 'Inactive services stay available only for historical understanding and safe legacy edits.'}
                  </p>
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
