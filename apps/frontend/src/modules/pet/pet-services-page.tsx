'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedFormActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { formatCurrencyForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetProduct, PetServiceCatalog, PetServiceCategory } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import {
  describePetServiceCatalogItem,
  formatPetServiceCategory,
  resolveAllowedPetServiceCategories,
  resolvePetServiceBookingMode
} from '@/modules/pet/pet-service-catalog-policy';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

const pageSize = 14;

const initialPage: PageResponse<PetServiceCatalog> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type ActiveFilter = 'all' | 'active' | 'inactive';

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
    .join(' · ');

  return activeLinks.length > 2
    ? copy.moreSupplies.replace('{preview}', preview).replace('{count}', String(activeLinks.length - 2))
    : preview;
}

// Rebuilds the update payload from a listed service, so a row toggle keeps every other field intact.
function buildPayloadFromService(service: PetServiceCatalog, overrides: Partial<Pick<PetServiceCatalog, 'active'>>) {
  return {
    name: service.name,
    description: service.description || undefined,
    category: service.category,
    active: overrides.active ?? service.active,
    basePrice: service.basePrice,
    durationMinutes: service.durationMinutes,
    commissionEligible: service.commissionEligible,
    allowInPlans: service.allowInPlans,
    allowStandaloneBooking: service.allowStandaloneBooking,
    inventoryLinks: service.inventoryLinks.map((link) => ({
      inventoryItemId: link.inventoryItemId,
      expectedQuantity: link.expectedQuantity,
      consumptionRule: link.consumptionRule,
      active: link.active
    }))
  };
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
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[color:var(--line)] px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[color:var(--control)]"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-[var(--ink)]">{label}</span>
        <span className="block text-xs leading-5 text-[var(--muted)]">{description}</span>
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
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [deleteCandidate, setDeleteCandidate] = useState<PetServiceCatalog | null>(null);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentCategoryFilter: string,
    currentActiveFilter: ActiveFilter
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

  function closeEditor() {
    resetForm();
    setIsEditorOpen(false);
  }

  function scrollToServiceForm() {
    window.requestAnimationFrame(() => {
      document.getElementById('pet-service-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function beginCreateService() {
    resetForm();
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
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
    setIsEditorOpen(true);
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

      closeEditor();
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(item: PetServiceCatalog) {
    const nextActive = !item.active;
    if (nextActive && !item.allowInPlans && !item.allowStandaloneBooking) {
      setError(copy.activeNeedsBookingMode);
      return;
    }

    setError(null);
    setSuccess(null);
    setTogglingId(item.id);
    try {
      await petService.updateService(item.id, buildPayloadFromService(item, { active: nextActive }));
      setSuccess(copy.updated);
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
    } finally {
      setTogglingId(null);
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
  const hasActiveFilters = Boolean(search || categoryFilter || activeFilter !== 'all');
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

  const categoryOptions = allowedCategories.map((value) => ({
    value,
    label: formatPetServiceCategory(value)
  }));

  const filterCategoryOptions = [
    { value: '', label: copy.allCategories },
    ...categoryOptions
  ];

  const activeFilterOptions: { value: ActiveFilter; label: string }[] = [
    { value: 'all', label: copy.allStatuses },
    { value: 'active', label: copy.onlyActive },
    { value: 'inactive', label: copy.onlyInactive }
  ];

  const columns: DataTableColumn<PetServiceCatalog>[] = [
    {
      key: 'service',
      header: copy.columnService,
      render: (item) => (
        <div className={item.active ? undefined : 'opacity-60'}>
          <p className="font-medium text-[var(--ink)]">{item.name}</p>
          <p className="line-clamp-1 max-w-md text-xs text-[var(--muted)]">
            {[formatPetServiceCategory(item.category), item.description].filter(Boolean).join(' · ')}
          </p>
        </div>
      )
    },
    {
      key: 'basePrice',
      header: copy.basePrice,
      className: 'text-right',
      render: (item) => <span className="ui-mono whitespace-nowrap">{formatCurrencyForLocale(locale, item.basePrice)}</span>
    },
    {
      key: 'durationMinutes',
      header: copy.columnDuration,
      className: 'text-right',
      render: (item) => <span className="ui-mono whitespace-nowrap">{item.durationMinutes} min</span>
    },
    {
      key: 'bookingRules',
      header: copy.columnScheduleUsage,
      render: (item) => (
        <span className="text-sm text-[var(--ink-2)]">{buildServiceAvailabilityLabel(copy, item)}</span>
      )
    },
    {
      key: 'commission',
      header: copy.columnCommission,
      render: (item) => (
        <span className="text-sm text-[var(--ink-2)]">
          {item.commissionEligible ? copy.generatesCommission : copy.noCommission}
        </span>
      )
    },
    {
      key: 'inventoryRecipe',
      header: copy.columnSupplies,
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">{formatInventoryLinkSummary(copy, item)}</span>
      )
    },
    {
      key: 'active',
      header: copy.active,
      render: (item) => (
        <PermissionGuard
          permission="pet.service.update"
          fallback={<span className="text-sm text-[var(--ink-2)]">{item.active ? copy.active : copy.inactive}</span>}
        >
          <button
            type="button"
            role="switch"
            aria-checked={item.active}
            aria-label={copy.toggleActive.replace('{name}', item.name)}
            disabled={togglingId === item.id}
            onClick={() => void handleToggleActive(item)}
            className="ui-switch"
          >
            <span aria-hidden="true" />
          </button>
        </PermissionGuard>
      )
    },
    {
      key: 'actions',
      header: copy.actions,
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
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
          title={copy.title}
          count={loading ? undefined : totalItems}
          description={copy.description}
          actions={(
            <PermissionGuard permission="pet.service.create">
              <button type="button" onClick={beginCreateService} className="ui-primary-button">
                {copy.newService}
              </button>
            </PermissionGuard>
          )}
        />

        <form
          role="search"
          aria-label={copy.searchLabel}
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="ui-field-shell flex min-h-9 min-w-[16rem] flex-1 items-center gap-2 rounded-md border border-[color:var(--control)] px-3 md:max-w-md">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            <span className="sr-only">{copy.searchLabel}</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </label>
          <label className="ui-filter-chip max-w-full" data-active={categoryFilter ? 'true' : 'false'}>
            <span>{copy.category}</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="max-w-[12rem] truncate bg-transparent font-medium text-[var(--ink)] outline-none"
            >
              {filterCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="ui-filter-chip max-w-full" data-active={activeFilter !== 'all' ? 'true' : 'false'}>
            <span>{copy.status}</span>
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
              className="max-w-[12rem] truncate bg-transparent font-medium text-[var(--ink)] outline-none"
            >
              {activeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setCategoryFilter('');
                setActiveFilter('all');
              }}
              className="inline-flex min-h-9 items-center gap-1 px-1 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.clear}
            </button>
          ) : null}
        </form>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.service.update' : 'pet.service.create'}>
            <section
              id="pet-service-editor"
              aria-labelledby="pet-service-editor-title"
              className="scroll-mt-4 rounded-md border border-[color:var(--line)] p-4"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="pet-service-editor-title" className="text-sm font-semibold text-[var(--ink)]">
                    {editingId ? copy.editService : copy.newService}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{copy.formDescription}</p>
                </div>

                <FormSection title={copy.sectionService}>
                  <FormInput label={copy.name} value={name} onChange={setName} required />
                  <FormSelect label={copy.category} value={category} options={categoryOptions} onChange={(value) => setCategory(value as PetServiceCategory)} />
                  <FormInput label={copy.operatingSummary} value={description} onChange={setDescription} wrapperClassName="md:col-span-2" />
                </FormSection>

                <FormSection title={copy.sectionPriceTime}>
                  <FormInput label={copy.basePrice} value={basePrice} onChange={setBasePrice} type="number" step="0.01" min="0" required />
                  <FormInput label={copy.durationMinutes} value={durationMinutes} onChange={setDurationMinutes} type="number" min="1" required />
                </FormSection>

                <FormSection title={copy.sectionRules}>
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
                  {activeSchedulingConflict ? (
                    <p role="alert" className="text-sm text-[var(--warn)] md:col-span-2">{copy.activeNeedsBookingPath}</p>
                  ) : null}
                </FormSection>

                <fieldset className="border-t border-[color:var(--line)] pt-4">
                  <legend className="pr-2 text-sm font-semibold text-[var(--ink)]">{copy.linkedSuppliesTitle}</legend>
                  <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-2xl text-xs text-[var(--muted)]">{copy.linkedSuppliesDescription}</p>
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
                    <div className="ui-notice-warning mt-3">{productsLookupError}</div>
                  ) : null}

                  {inventoryLinks.length > 0 ? (
                    <ul className="mt-3 divide-y divide-[color:var(--line-soft)]">
                      {inventoryLinks.map((link, index) => (
                        <li key={`${link.inventoryItemId || 'draft'}-${index}`} className="py-3">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_180px_auto] md:items-end">
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
                            <div className="flex items-center gap-3 md:justify-end">
                              <label className="flex items-center gap-2 text-sm text-[var(--ink-2)]">
                                <input
                                  type="checkbox"
                                  checked={link.active}
                                  onChange={(event) => handleInventoryLinkChange(index, { active: event.target.checked })}
                                  className="h-4 w-4 rounded border-[color:var(--control)]"
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
                          <p className="mt-1.5 text-xs text-[var(--muted)]">
                            {link.inventoryItemName
                              ? `${link.inventoryItemName}${link.inventoryItemSku ? ` (${link.inventoryItemSku})` : ''}`
                              : copy.supplyHint}
                            {link.unitOfMeasure ? copy.unitSuffix.replace('{unit}', link.unitOfMeasure) : ''}
                            {link.active ? copy.supplyVisibleHint : copy.supplyHiddenHint}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--muted)]">{copy.noSuppliesHint}</p>
                  )}
                </fieldset>

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
                    onClick={closeEditor}
                    className="ui-secondary-button"
                  >
                    {copy.cancelEdit}
                  </button>
                </div>
              </form>
            </section>
          </PermissionGuard>
        ) : null}

        <div className="space-y-2">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            loading={loading}
            loadingTitle={copy.loadingTitle}
            loadingDescription={copy.loadingDescription}
            emptyState={{
              title: copy.emptyTitle,
              description: hasActiveFilters
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
            pageSize={pageSize}
            onPageChange={(page) => void load(page, search, categoryFilter, activeFilter)}
          />
        </div>

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
