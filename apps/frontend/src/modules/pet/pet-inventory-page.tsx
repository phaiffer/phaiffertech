'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Package, TriangleAlert, TrendingUp, type LucideIcon } from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass,
  sharedReminderSurfaceClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue,
  resolvePetLookupLabel
} from '@/modules/pet/pet-lookup-feedback';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetInventoryMovement, PetProduct } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<PetInventoryMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type InventoryMessages = ReturnType<typeof useAppMessages>['petInventory'];

function applyTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function formatMovementType(value: string, messages: InventoryMessages) {
  return value === 'IN' ? messages.movementTypes.inbound : value === 'OUT' ? messages.movementTypes.outbound : value;
}

function formatMovementSource(value: string | null | undefined, messages: InventoryMessages) {
  switch (value) {
    case 'MANUAL':
      return messages.sourceTypes.manual;
    case 'PET_RETAIL_SALE':
      return messages.sourceTypes.retailSale;
    case 'PET_CLINIC_CONSUMPTION':
      return messages.sourceTypes.clinicalConsumption;
    case 'PET_PRODUCT_SYNC':
      return messages.sourceTypes.productSync;
    case 'IOT_MAINTENANCE_CONSUMPTION':
      return messages.sourceTypes.maintenanceConsumption;
    case 'IOT_PART_REPLACEMENT':
      return messages.sourceTypes.stockReplacement;
    case 'IOT_PART_SYNC':
      return messages.sourceTypes.catalogSync;
    default:
      return value ?? messages.sourceTypes.unknown;
  }
}

function resolveStockHealth(product: PetProduct, messages: InventoryMessages) {
  if (product.currentQuantity <= product.minimumQuantity) {
    return {
      label: messages.health.belowMinimum,
      status: 'alert',
      detail: applyTemplate(messages.health.belowMinimumDetail, {
        value: product.minimumQuantity,
        unit: product.unitOfMeasure
      })
    };
  }

  if (product.currentQuantity <= product.reorderPoint) {
    return {
      label: messages.health.reorderNow,
      status: 'warn',
      detail: applyTemplate(messages.health.reorderNowDetail, {
        value: product.reorderPoint,
        unit: product.unitOfMeasure
      })
    };
  }

  return {
    label: messages.health.healthy,
    status: 'ok',
    detail: messages.health.healthyDetail
  };
}

type InventorySpotlightCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'warning';
};

function InventorySpotlightCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default'
}: InventorySpotlightCardProps) {
  const toneClass = tone === 'accent'
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] text-white shadow-[0_20px_40px_-28px_rgba(16,185,129,0.5)]'
    : tone === 'warning'
      ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(255,255,255,0.98))]'
      : 'border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.99)_140px)]';

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone === 'accent' ? 'text-white/72' : 'text-slate-600'}`}>
            {label}
          </p>
          <p className={`mt-3 text-3xl font-bold tracking-[-0.03em] ${tone === 'accent' ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tone === 'accent'
              ? 'bg-white/12 text-white'
              : tone === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 ${tone === 'accent' ? 'text-sm leading-6 text-white/80' : sharedCompactTextClass}`}>{detail}</p>
    </div>
  );
}

export function PetInventoryPage() {
  const { locale } = useAppI18n();
  const appMessages = useAppMessages();
  const messages = appMessages.petInventory;
  const commonButtons = appMessages.common.buttons;
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<PetInventoryMovement>>(initialPage);
  const [products, setProducts] = useState<PetProduct[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [productFilterId, setProductFilterId] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState('IN');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetInventoryMovement | null>(null);
  const canReadProducts = hasPermission('pet.product.read');
  const movementTypeOptions = useMemo(() => ([
    { value: '', label: messages.movementTypes.all },
    { value: 'IN', label: messages.movementTypes.inbound },
    { value: 'OUT', label: messages.movementTypes.outbound }
  ]), [messages.movementTypes.all, messages.movementTypes.inbound, messages.movementTypes.outbound]);
  const formMovementTypeOptions = useMemo(
    () => movementTypeOptions.filter((item) => item.value),
    [movementTypeOptions]
  );

  const productOptions = useMemo(() => ([
    { value: '', label: messages.filters.allProducts },
    ...products.map((item) => ({ value: item.id, label: `${item.name} (${item.currentQuantity ?? item.stockQuantity})` }))
  ]), [messages.filters.allProducts, products]);

  const formProductOptions = useMemo(() => ([
    { value: '', label: messages.filters.selectProduct },
    ...products.map((item) => ({ value: item.id, label: `${item.name} (${item.currentQuantity ?? item.stockQuantity})` }))
  ]), [messages.filters.selectProduct, products]);

  const loadProducts = useCallback(async () => {
    if (!canReadProducts) {
      setProducts([]);
      setLookupIssues([{
        key: 'products',
        label: messages.lookup.productsLabel,
        message: resolvePetLookupIssue(null, 'pet.product.read')
      }]);
      return;
    }

    try {
      const result = await petService.listProducts(0, 200, '');
      setProducts(resolvePageItems(result));
      setLookupIssues([]);
    } catch (err) {
      setProducts([]);
      setLookupIssues([{
        key: 'products',
        label: messages.lookup.productsLabel,
        message: resolvePetLookupIssue(err)
      }]);
    }
  }, [canReadProducts, messages.lookup.productsLabel]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentProductId: string,
    currentMovementType: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listInventoryMovements(page, pageSize, currentSearch, {
        productId: currentProductId || undefined,
        movementType: currentMovementType || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.loadError);
    } finally {
      setLoading(false);
    }
  }, [messages.feedback.loadError]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void load(0, search, productFilterId, movementTypeFilter);
  }, [load, movementTypeFilter, productFilterId, search]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const productsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'products');
  const activeFilterCount = [search, productFilterId, movementTypeFilter].filter(Boolean).length;
  const lowStockProducts = products.filter((product) => product.currentQuantity <= product.reorderPoint);
  const criticalLowStockProducts = products.filter((product) => product.currentQuantity <= product.minimumQuantity);
  const movedUnitsOnPage = rows.reduce((total, item) => total + item.quantity, 0);
  const outboundMovementsOnPage = rows.filter((item) => item.movementType === 'OUT').length;

  const inventorySignals = [
    {
      key: 'catalog-products',
      icon: Package,
      label: messages.summary.trackedLabel,
      value: new Intl.NumberFormat(locale).format(products.length),
      detail: messages.summary.trackedDetail,
      tone: 'default' as const
    },
    {
      key: 'critical-products',
      icon: TriangleAlert,
      label: messages.summary.belowMinimumLabel,
      value: new Intl.NumberFormat(locale).format(criticalLowStockProducts.length),
      detail: criticalLowStockProducts.length > 0
        ? messages.summary.belowMinimumDetail
        : messages.summary.belowMinimumSafe,
      tone: criticalLowStockProducts.length > 0 ? 'warning' as const : 'default' as const
    },
    {
      key: 'reorder-products',
      icon: TrendingUp,
      label: messages.summary.reorderLabel,
      value: new Intl.NumberFormat(locale).format(lowStockProducts.length),
      detail: lowStockProducts.length > 0
        ? messages.summary.reorderDetail
        : messages.summary.reorderSafe,
      tone: lowStockProducts.length > 0 ? 'accent' as const : 'default' as const
    },
    {
      key: 'outbound-movements',
      icon: ArrowRightLeft,
      label: messages.summary.outboundLabel,
      value: new Intl.NumberFormat(locale).format(outboundMovementsOnPage),
      detail: activeFilterCount > 0
        ? messages.summary.filteredDetail
        : applyTemplate(messages.summary.visibleQuantityDetail, { value: movedUnitsOnPage }),
      tone: 'default' as const
    }
  ];

  function resetForm() {
    setEditingId(null);
    setProductId('');
    setMovementType('IN');
    setQuantity('1');
    setNotes('');
  }

  function scrollToMovementForm() {
    document.getElementById('pet-inventory-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function beginCreateMovement() {
    resetForm();
    scrollToMovementForm();
  }

  function beginEdit(item: PetInventoryMovement) {
    setEditingId(item.id);
    setProductId(item.productId);
    setMovementType(item.movementType);
    setQuantity(String(item.quantity));
    setNotes(item.notes ?? '');
    setError(null);
    setSuccess(null);
    scrollToMovementForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);
    if (!productId || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      setError(messages.validation.selectProduct);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        productId,
        movementType,
        quantity: parsedQuantity,
        notes: notes || undefined
      };

      if (editingId) {
        await petService.updateInventoryMovement(editingId, payload);
        setSuccess(messages.feedback.updated);
      } else {
        await petService.createInventoryMovement(payload);
        setSuccess(messages.feedback.created);
      }

      resetForm();
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteInventoryMovement(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(messages.feedback.removed);
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.deleteError);
    }
  }

  const columns: DataTableColumn<PetInventoryMovement>[] = [
    {
      key: 'createdAt',
      header: messages.columns.recorded,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatDateTimeForLocale(locale, item.createdAt)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {messages.columns.updated} {formatDateTimeForLocale(locale, item.updatedAt)}
          </p>
        </div>
      )
    },
    {
      key: 'product',
      header: messages.columns.product,
      render: (item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const stockHealth = product ? resolveStockHealth(product, messages) : null;

        return (
          <div>
            <p className="font-medium text-slate-900">
              {item.productName
                ? (item.productSku ? `${item.productName} (${item.productSku})` : item.productName)
                : resolvePetLookupLabel(products, item.productId, (entry) => entry.name, messages.columns.product, productsLookupUnavailable)}
            </p>
            {product ? (
              <p className={`mt-1 ${sharedCompactTextClass}`}>
                {applyTemplate(messages.columns.stockLine, {
                  quantity: product.currentQuantity,
                  unit: product.unitOfMeasure,
                  reorder: product.reorderPoint
                })}
              </p>
            ) : null}
            {stockHealth ? (
              <div className="mt-2">
                <StatusBadge status={stockHealth.status} />
              </div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'movementType',
      header: messages.columns.movement,
      render: (item) => (
        <div>
          <StatusBadge status={item.movementType === 'IN' ? 'active' : 'warn'} />
          <p className={`mt-2 ${sharedCompactTextClass}`}>
            {formatMovementType(item.movementType, messages)} {item.quantity}{' '}
            {item.quantity === 1 ? messages.columns.unit : messages.columns.units}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.movementType === 'IN'
              ? messages.columns.returnedLine
              : messages.columns.outboundLine}
          </p>
        </div>
      )
    },
    {
      key: 'sourceType',
      header: messages.columns.source,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatMovementSource(item.sourceType, messages)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.reason ?? item.notes ?? messages.columns.noOperationalNote}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {messages.columns.reasonDetail}
          </p>
        </div>
      )
    },
    {
      key: 'balance',
      header: messages.columns.balanceImpact,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {item.quantityBefore} to {item.quantityAfter}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {applyTemplate(messages.columns.balanceChanged, { quantity: item.quantity })}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: messages.columns.actions,
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.inventory.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              {commonButtons.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.inventory.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              {commonButtons.delete}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.inventory.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          eyebrow={messages.eyebrow}
          title={messages.title}
          description={messages.description}
          actions={(
            <div className="flex flex-wrap gap-3">
              <Link href="/pet/products" className="ui-secondary-button">
                {messages.openProducts}
              </Link>
              <PermissionGuard permission="pet.inventory.create">
                <button type="button" onClick={beginCreateMovement} className="ui-primary-button">
                  {messages.recordMovement}
                </button>
              </PermissionGuard>
            </div>
          )}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {inventorySignals.map((card) => (
            <InventorySpotlightCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={card.value}
              detail={card.detail}
              tone={card.tone}
            />
          ))}
        </div>

        <PageSection
          tone="muted"
          title={messages.watchTitle}
          description={messages.watchDescription}
        >
          {productsLookupUnavailable ? (
            <div className="ui-notice-warning">
              {messages.lookup.healthWarning}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="ui-notice-neutral">
              {messages.feedback.healthy}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {lowStockProducts.slice(0, 6).map((product) => {
                const stockHealth = resolveStockHealth(product, messages);
                return (
                  <div
                    key={product.id}
                    className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{product.name}</p>
                        <p className={`mt-1 ${sharedCompactTextClass}`}>SKU {product.sku}</p>
                      </div>
                      <StatusBadge status={stockHealth.status} />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                      {product.currentQuantity} {product.unitOfMeasure}
                    </p>
                    <p className={`mt-2 ${sharedCompactTextClass}`}>
                      {messages.health.belowMinimum} {product.minimumQuantity} • {messages.health.reorderNow} {product.reorderPoint}
                    </p>
                    <p className={`mt-2 ${sharedCompactTextClass}`}>{stockHealth.detail}</p>
                  </div>
                );
              })}
            </div>
          )}

          {criticalLowStockProducts.length > 0 ? (
            <div className="ui-notice-warning mt-5">
              {applyTemplate(messages.feedback.criticalWarning, { count: criticalLowStockProducts.length })}
            </div>
          ) : null}
        </PageSection>

        <PageSection
          tone="muted"
          title={messages.filters.title}
          description={messages.filters.description}
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.8fr)] xl:items-end">
              <SearchBar
                label={messages.filters.searchLabel}
                value={searchInput}
                onChange={setSearchInput}
                placeholder={messages.filters.searchPlaceholder}
              />
              <FormSelect
                label={messages.filters.productLabel}
                value={productFilterId}
                options={productOptions}
                onChange={setProductFilterId}
                disabled={productsLookupUnavailable}
              />
              <FormSelect
                label={messages.filters.directionLabel}
                value={movementTypeFilter}
                options={movementTypeOptions}
                onChange={setMovementTypeFilter}
              />
            </div>

            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                {messages.filters.apply}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setProductFilterId('');
                  setMovementTypeFilter('');
                }}
                className="ui-inline-button"
              >
                {messages.filters.clear}
              </button>
            </div>
          </div>
        </PageSection>

        <PetLookupFeedback issues={lookupIssues} />

        <div id="pet-inventory-form-section">
          <PageSection
            title={editingId ? messages.form.editTitle : messages.form.createTitle}
            description={messages.form.description}
          >
            <PermissionGuard permission={editingId ? 'pet.inventory.update' : 'pet.inventory.create'}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label={messages.form.productLabel}
                    value={productId}
                    options={formProductOptions}
                    onChange={setProductId}
                    disabled={productsLookupUnavailable}
                  />
                  <FormSelect
                    label={messages.form.directionLabel}
                    value={movementType}
                    options={formMovementTypeOptions}
                    onChange={setMovementType}
                  />
                  <FormInput
                    label={messages.form.quantityLabel}
                    value={quantity}
                    onChange={setQuantity}
                    type="number"
                    required
                  />
                  <FormInput
                    label={messages.form.noteLabel}
                    value={notes}
                    onChange={setNotes}
                    placeholder={messages.form.notePlaceholder}
                  />
                </div>

                <div className={sharedReminderSurfaceClass}>
                  <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">{messages.form.reminderTitle}</p>
                  <p className={`mt-1 ${sharedCompactTextClass}`}>
                    {messages.form.reminderDescription}
                  </p>
                </div>

                {productsLookupUnavailable ? (
                  <div className="ui-notice-warning">
                    {messages.lookup.movementWarning}
                  </div>
                ) : null}

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting || productsLookupUnavailable}
                    className="ui-primary-button"
                  >
                    {submitting ? messages.form.saving : editingId ? messages.form.update : messages.form.create}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ui-secondary-button"
                    >
                      {messages.form.cancel}
                    </button>
                  ) : null}
                </div>
              </form>
            </PermissionGuard>
          </PageSection>
        </div>

        <PageSection
          title={messages.ledger.title}
          description={messages.ledger.description}
        >
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            loading={loading}
            loadingTitle={messages.ledger.loadingTitle}
            loadingDescription={messages.ledger.loadingDescription}
            emptyState={{
              title: messages.ledger.emptyTitle,
              description: messages.ledger.emptyDescription,
              action: (
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/pet/products" className="ui-secondary-button">
                    {messages.openProducts}
                  </Link>
                  {hasPermission('pet.inventory.create') ? (
                    <button type="button" onClick={beginCreateMovement} className="ui-primary-button">
                      {messages.ledger.firstMovement}
                    </button>
                  ) : null}
                </div>
              )
            }}
          />
          <div className="pt-5">
            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(page) => void load(page, search, productFilterId, movementTypeFilter)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={deleteCandidate !== null}
          title={messages.dialog.title}
          description={messages.dialog.description}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
