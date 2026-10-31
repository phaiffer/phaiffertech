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
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

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

function formatInventoryLinkSummary(copy: AppMessages['screens']['petServices'], service: Pick<PetServiceCatalog, 'inventoryLinks'>) {
  const activeLinks = service.inventoryLinks.filter((link) => link.active);
  if (activeLinks.length === 0) {
    return copy.noPlannedSupply;
  }

  const preview = activeLinks
    .slice(0, 2)
    .map((link) => `${link.inventoryItemName} x${formatExpectedQuantity(link.expectedQuantity)} ${link.unitOfMeasure}`)
    .join(' • ');

  return activeLinks.length > 2
    ? copy.moreSupplies.replace('{preview}', preview).replace('{count}', String(activeLinks.length - 2))
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

function buildServiceAvailabilityLabel(copy: AppMessages['screens']['petServices'], service: Pick<PetServiceCatalog, 'allowInPlans' | 'allowStandaloneBooking'>) {
  switch (resolvePetServiceBookingMode(service)) {
    case 'PLAN_ONLY':
      return copy.planSessionsOnly;
    case 'STANDALONE_ONLY':
      return copy.standaloneOnly;
    case 'UNAVAILABLE':
      return copy.unavailableForBooking;
    default:
      return copy.standaloneAndPlan;
  }
}

export function PetServicesPage() {
  const copy = useAppMessages().screens.petServices;
  const { locale } = useAppI18n();
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
      setError(resolveApiErrorMessage(err, copy.loadError));
    } finally {
      setLoading(false);
    }
  }, [copy]);

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
      setProductsLookupError(resolveApiErrorMessage(err, copy.suppliesLoadError));
    }
  }, [copy]);

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
      setError(copy.invalidPriceDuration);
      return;
    }

    if (active && !allowInPlans && !allowStandaloneBooking) {
      setError(copy.activeNeedsBookingMode);
      return;
    }

    const parsedInventoryLinks = inventoryLinks.map((link) => ({
      ...link,
      expectedQuantityNumber: Number(link.expectedQuantity)
    }));

    if (parsedInventoryLinks.some((link) => !link.inventoryItemId || Number.isNaN(link.expectedQuantityNumber) || link.expectedQuantityNumber <= 0)) {
      setError(copy.supplyLineInvalid);
      return;
    }

    const selectedInventoryIds = parsedInventoryLinks.map((link) => link.inventoryItemId);
    if (new Set(selectedInventoryIds).size !== selectedInventoryIds.length) {
      setError(copy.supplyDuplicate);
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
        setSuccess(copy.updated);
      } else {
        await petService.createService(payload);
        setSuccess(copy.created);
      }

      resetForm();
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
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
      setSuccess(copy.deleted);
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.deleteError));
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
          : copy.linkedItemFallback.replace('{id}', link.inventoryItemId)
      }));

    return [
      { value: '', label: copy.selectSupply },
      ...knownOptions,
      ...fallbackOptions
    ];
  }, [inventoryLinks, products, copy]);
  const activeInventoryLinks = inventoryLinks.filter((link) => link.inventoryItemId && link.active);
  const inventoryPreview = activeInventoryLinks.length > 0
    ? activeInventoryLinks
      .map((link) => {
        const itemLabel = link.inventoryItemName
          ?? products.find((product) => product.inventoryItemId === link.inventoryItemId)?.name
          ?? copy.linkedSupplyFallback;
        const unit = link.unitOfMeasure
          ?? products.find((product) => product.inventoryItemId === link.inventoryItemId)?.unitOfMeasure
          ?? 'UNIT';
        return `${itemLabel} x${link.expectedQuantity || '0'} ${unit}`;
      })
      .join(' • ')
    : copy.noPlannedUsage;
  const draftServicePreview = describePetServiceCatalogItem({
    id: editingId ?? 'draft-service',
    name: name.trim() || copy.draftService,
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
  }, 'pt-BR');
  const draftAvailabilityLabel = buildServiceAvailabilityLabel(copy, { allowInPlans, allowStandaloneBooking });

  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'services-in-scope',
      label: copy.metricVisible,
      value: totalItems,
      trend: activeFilterCount > 0
        ? copy.metricVisibleFiltered
        : copy.metricVisibleAll
    },
    {
      key: 'active-services',
      label: copy.metricActive,
      value: activeServices,
      trend: copy.metricActiveDetail
    },
    {
      key: 'plan-ready-services',
      label: copy.metricPlanEligible,
      value: planReadyServices,
      trend: copy.metricPlanEligibleDetail
    },
    {
      key: 'average-service-duration',
      label: copy.metricAverageDuration,
      value: averageDuration,
      trend: copy.averageBasePrice.replace('{amount}', String(averageBasePrice))
    }
  ];

  const categoryOptions = allowedCategories.map((value) => ({
    value,
    label: formatPetServiceCategory(value)
  }));

  const filterCategoryOptions = [
    { value: '', label: copy.allCategories },
    ...categoryOptions
  ];

  const activeFilterOptions = [
    { value: 'all', label: copy.allStatuses },
    { value: 'active', label: copy.onlyActive },
    { value: 'inactive', label: copy.onlyInactive }
  ];

  const columns: DataTableColumn<PetServiceCatalog>[] = [
    {
      key: 'service',
      header: copy.columnService,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {item.description ?? copy.noSummary}
          </p>
        </div>
      )
    },
    {
      key: 'category',
      header: copy.category,
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">{formatPetServiceCategory(item.category)}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {item.active ? copy.activeForBooking : copy.inactiveForBooking}
          </p>
        </div>
      )
    },
    {
      key: 'basePrice',
      header: copy.basePrice,
      render: (item) => item.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      key: 'durationMinutes',
      header: copy.columnDuration,
      render: (item) => `${item.durationMinutes} min`
    },
    {
      key: 'bookingRules',
      header: copy.columnScheduleUsage,
      render: (item) => (
        <div className="space-y-1 text-xs text-[color:var(--app-shell-muted)]">
          <p>{item.allowStandaloneBooking ? copy.standaloneAllowed : copy.planRequired}</p>
          <p>{item.allowInPlans ? copy.planSessionsAllowed : copy.standaloneOnly}</p>
          <p>{item.commissionEligible ? copy.generatesCommission : copy.noCommission}</p>
        </div>
      )
    },
    {
      key: 'inventoryRecipe',
      header: copy.columnSupplies,
      render: (item) => (
        <div className="space-y-1 text-xs text-[color:var(--app-shell-muted)]">
          <p className="font-medium text-slate-900">
            {item.inventoryLinks.filter((link) => link.active).length} {copy.linkedSupplies}
          </p>
          <p>{formatInventoryLinkSummary(copy, item)}</p>
        </div>
      )
    },
    {
      key: 'actions',
      header: copy.actions,
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.service.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              {copy.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.service.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              {copy.delete}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.service.read"
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="Gestão Pet"
          title={copy.title}
          description={copy.description}
          actions={(
            <PermissionGuard permission="pet.service.create">
              <button type="button" onClick={beginCreateService} className="ui-primary-button">
                {copy.newService}
              </button>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title={copy.filtersTitle}
          description={copy.filtersDescription}
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(0,0.9fr))] xl:items-end">
              <SearchBar
                label={copy.searchLabel}
                value={searchInput}
                onChange={setSearchInput}
                placeholder={copy.searchPlaceholder}
              />
              <FormSelect
                label={copy.category}
                value={categoryFilter}
                options={filterCategoryOptions}
                onChange={setCategoryFilter}
              />
              <FormSelect
                label={copy.status}
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
                {copy.search}
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
                {copy.clear}
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? copy.filteredHint
                  : copy.noFiltersHint}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'pet.service.update' : 'pet.service.create'}>
          <div id="pet-service-form-section">
            <PageSection
              title={editingId ? copy.editService : copy.createService}
              description={copy.formDescription}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label={copy.name} value={name} onChange={setName} required />
                  <FormSelect label={copy.category} value={category} options={categoryOptions} onChange={(value) => setCategory(value as PetServiceCategory)} />
                  <FormInput label={copy.basePrice} value={basePrice} onChange={setBasePrice} type="number" required />
                  <FormInput label={copy.durationMinutes} value={durationMinutes} onChange={setDurationMinutes} type="number" required />
                  <FormInput label={copy.operatingSummary} value={description} onChange={setDescription} wrapperClassName="xl:col-span-2" />
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  <ServiceFlagToggle
                    label={copy.activeForSchedule}
                    description={copy.inactiveHint}
                    checked={active}
                    onChange={setActive}
                  />
                  <ServiceFlagToggle
                    label={copy.generatesCommission}
                    description={copy.commissionHint}
                    checked={commissionEligible}
                    onChange={setCommissionEligible}
                  />
                  <ServiceFlagToggle
                    label={copy.allowedInPlans}
                    description={copy.allowedInPlansHint}
                    checked={allowInPlans}
                    onChange={setAllowInPlans}
                  />
                  <ServiceFlagToggle
                    label={copy.allowedStandalone}
                    description={copy.allowedStandaloneHint}
                    checked={allowStandaloneBooking}
                    onChange={setAllowStandaloneBooking}
                  />
                </div>

                <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        {copy.linkedSuppliesTitle}
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
                        {copy.linkedSuppliesDescription}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddInventoryLink}
                      disabled={Boolean(productsLookupError)}
                      className="ui-secondary-button"
                    >
                      {copy.addSupply}
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
                              label={copy.supply}
                              value={link.inventoryItemId}
                              options={inventoryOptions}
                              onChange={(value) => handleInventoryLinkChange(index, { inventoryItemId: value })}
                              disabled={Boolean(productsLookupError)}
                            />
                            <FormInput
                              label={copy.quantityPerService}
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
                                {copy.active}
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveInventoryLink(index)}
                                className="ui-inline-button"
                              >
                                {copy.remove}
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-[color:var(--app-shell-muted)]">
                            {link.inventoryItemName
                              ? `${link.inventoryItemName}${link.inventoryItemSku ? ` (${link.inventoryItemSku})` : ''}`
                              : copy.supplyHint}
                            {link.unitOfMeasure ? copy.unitSuffix.replace('{unit}', link.unitOfMeasure) : ''}
                            {link.active ? copy.supplyVisibleHint : copy.supplyHiddenHint}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[color:var(--app-shell-muted)]">
                      {copy.noSuppliesHint}
                    </p>
                  )}
                </div>

                <div className={`rounded-2xl border px-4 py-3 ${
                  activeSchedulingConflict
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)]'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                    {copy.previewTitle}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[color:var(--app-shell-heading)]">
                    {draftServicePreview}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-[color:var(--app-shell-muted)] xl:grid-cols-2">
                    <p>{copy.previewCategory} {formatPetServiceCategory(category)}</p>
                    <p>{copy.previewStatus} {active ? copy.activeForBooking : copy.hiddenFromBooking}</p>
                    <p>{copy.previewUsage} {draftAvailabilityLabel}</p>
                    <p>{commissionEligible ? copy.inCommission : copy.noCommission}</p>
                    <p>{copy.pricingFutureHint}</p>
                    <p>{copy.previewStatus} {active ? copy.activeForBooking : copy.hiddenFromBooking}</p>
                    <p>{copy.previewBookingMode} {draftAvailabilityLabel}</p>
                    <p>{commissionEligible ? copy.commissionReady : copy.noCommission}</p>
                    <p className="xl:col-span-2">{copy.previewSupplies} {inventoryPreview}</p>
                  </div>
                  <p className={`mt-3 text-xs ${activeSchedulingConflict ? 'text-amber-800' : 'text-[color:var(--app-shell-muted)]'}`}>
                    {activeSchedulingConflict
                      ? copy.activeNeedsBookingPath
                      : active
                        ? copy.previewMatchesOperator
                        : copy.inactiveReadOnlyHint}
                  </p>
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? copy.saving : editingId ? copy.updateService : copy.createService}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="ui-secondary-button"
                  >
                    {editingId ? copy.cancelEdit : copy.clearForm}
                  </button>
                </div>
              </form>
            </PageSection>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          title={copy.listTitle}
          description={copy.listDescription}
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">{copy.total} {totalItems} {copy.servicesCount}</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle={copy.loadingTitle}
              loadingDescription={copy.loadingDescription}
              emptyState={{
                title: copy.emptyTitle,
                description: activeFilterCount > 0
                  ? copy.emptyFiltered
                  : copy.emptyDescription,
                action: (
                  <PermissionGuard permission="pet.service.create">
                    <button type="button" onClick={beginCreateService} className="ui-primary-button">
                      {copy.createFirst}
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
          title={copy.deleteConfirmTitle}
          description={deleteCandidate ? copy.deleteConfirmDescription.replace('{name}', describePetServiceCatalogItem(deleteCandidate, locale)) : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
