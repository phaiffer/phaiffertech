'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedFormActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
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
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

const pageSize = 14;
const WATCHLIST_LIMIT = 8;

const initialPage: PageResponse<PetInventoryMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type InventoryMessages = ReturnType<typeof useAppMessages>['petInventory'];
type StockTone = 'danger' | 'warn' | 'done';

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

function resolveStockHealth(product: PetProduct, messages: InventoryMessages): { label: string; tone: StockTone; detail: string } {
  if (product.currentQuantity <= product.minimumQuantity) {
    return {
      label: messages.health.belowMinimum,
      tone: 'danger',
      detail: applyTemplate(messages.health.belowMinimumDetail, {
        value: product.minimumQuantity,
        unit: product.unitOfMeasure
      })
    };
  }

  if (product.currentQuantity <= product.reorderPoint) {
    return {
      label: messages.health.reorderNow,
      tone: 'warn',
      detail: applyTemplate(messages.health.reorderNowDetail, {
        value: product.reorderPoint,
        unit: product.unitOfMeasure
      })
    };
  }

  return {
    label: messages.health.healthy,
    tone: 'done',
    detail: messages.health.healthyDetail
  };
}

function StockDot({ tone, label }: { tone: StockTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--ink-2)]">
      <span className="ui-status-dot" data-status={tone} aria-hidden="true" />
      {label}
    </span>
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

  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
    ...products.map((item) => ({ value: item.id, label: item.name }))
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
      setError(resolveApiErrorMessage(err, messages.feedback.loadError));
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
  const hasActiveFilters = Boolean(search || productFilterId || movementTypeFilter);
  // Product counts come from the catalog lookup (up to 200 products), not from the movement page.
  const reorderProducts = products.filter((product) => product.currentQuantity <= product.reorderPoint);
  const belowMinimumProducts = products.filter((product) => product.currentQuantity <= product.minimumQuantity);
  const numberFormat = new Intl.NumberFormat(locale);

  function resetForm() {
    setEditingId(null);
    setProductId('');
    setMovementType('IN');
    setQuantity('1');
    setNotes('');
  }

  function closeEditor() {
    resetForm();
    setIsEditorOpen(false);
  }

  function scrollToEditor() {
    window.requestAnimationFrame(() => {
      document.getElementById('pet-inventory-editor')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    });
  }

  function beginCreateMovement() {
    resetForm();
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
    scrollToEditor();
  }

  function beginEdit(item: PetInventoryMovement) {
    setEditingId(item.id);
    setProductId(item.productId);
    setMovementType(item.movementType);
    setQuantity(String(item.quantity));
    setNotes(item.notes ?? '');
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
    scrollToEditor();
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

      closeEditor();
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.feedback.saveError));
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
      setError(resolveApiErrorMessage(err, messages.feedback.deleteError));
    }
  }

  const columns: DataTableColumn<PetInventoryMovement>[] = [
    {
      key: 'createdAt',
      header: messages.columns.recorded,
      render: (item) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{formatDateTimeForLocale(locale, item.createdAt)}</span>
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
            <p className="font-medium text-[var(--ink)]">
              {item.productName
                ? item.productName
                : resolvePetLookupLabel(products, item.productId, (entry) => entry.name, messages.columns.product, productsLookupUnavailable)}
            </p>
            {item.productSku ? <p className="ui-mono text-xs text-[var(--muted)]">{item.productSku}</p> : null}
            {stockHealth ? <StockDot tone={stockHealth.tone} label={stockHealth.label} /> : null}
          </div>
        );
      }
    },
    {
      key: 'movementType',
      header: messages.columns.movement,
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--ink)]">
          <span className="ui-status-dot" data-status={item.movementType === 'IN' ? 'done' : 'warn'} aria-hidden="true" />
          {formatMovementType(item.movementType, messages)}{' '}
          <span className="ui-mono">{item.quantity}</span>{' '}
          {item.quantity === 1 ? messages.columns.unit : messages.columns.units}
        </span>
      )
    },
    {
      key: 'sourceType',
      header: messages.columns.source,
      render: (item) => (
        <div>
          <p className="text-[var(--ink)]">{formatMovementSource(item.sourceType, messages)}</p>
          <p className="line-clamp-1 max-w-xs text-xs text-[var(--muted)]">
            {item.reason ?? item.notes ?? messages.columns.noOperationalNote}
          </p>
        </div>
      )
    },
    {
      key: 'balance',
      header: messages.columns.balanceImpact,
      className: 'text-right',
      render: (item) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink)]">
          {item.quantityBefore} → {item.quantityAfter}
        </span>
      )
    },
    {
      key: 'actions',
      header: messages.columns.actions,
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <PermissionGuard permission="pet.inventory.update">
            <button type="button" onClick={() => beginEdit(item)} className="ui-inline-button">
              {commonButtons.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.inventory.delete">
            <button type="button" onClick={() => setDeleteCandidate(item)} className="ui-inline-danger-button">
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
          title={messages.title}
          count={loading ? undefined : totalItems}
          description={messages.description}
          actions={(
            <div className="flex flex-wrap gap-2">
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

        {!productsLookupUnavailable ? (
          <dl className="grid gap-4 border-y border-[color:var(--line)] py-3 sm:grid-cols-3">
            {[
              { label: messages.summary.trackedLabel, value: products.length, tone: undefined },
              { label: messages.summary.belowMinimumLabel, value: belowMinimumProducts.length, tone: belowMinimumProducts.length > 0 ? 'text-[var(--danger)]' : undefined },
              { label: messages.summary.reorderLabel, value: reorderProducts.length, tone: reorderProducts.length > 0 ? 'text-[var(--warn)]' : undefined }
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-xs text-[var(--muted)]">{item.label}</dt>
                <dd className={`ui-mono mt-0.5 text-lg font-semibold ${item.tone ?? 'text-[var(--ink)]'}`}>
                  {numberFormat.format(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <section aria-labelledby="pet-inventory-watch-title" className="space-y-2">
          <h2 id="pet-inventory-watch-title" className="text-sm font-semibold text-[var(--ink)]">{messages.watchTitle}</h2>
          {productsLookupUnavailable ? (
            <div className="ui-notice-warning">{messages.lookup.healthWarning}</div>
          ) : reorderProducts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{messages.feedback.healthy}</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line-soft)] rounded-md border border-[color:var(--line)]">
              {reorderProducts.slice(0, WATCHLIST_LIMIT).map((product) => {
                const stockHealth = resolveStockHealth(product, messages);
                return (
                  <li key={product.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--ink)]">{product.name}</p>
                      <p className="text-xs text-[var(--muted)]">{stockHealth.detail}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="ui-mono text-sm text-[var(--ink)]">{product.currentQuantity} {product.unitOfMeasure}</span>
                      <StockDot tone={stockHealth.tone} label={stockHealth.label} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form
          role="search"
          aria-label={messages.filters.searchLabel}
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="ui-field-shell flex min-h-9 min-w-[16rem] flex-1 items-center gap-2 rounded-md border border-[color:var(--control)] px-3 md:max-w-md">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            <span className="sr-only">{messages.filters.searchLabel}</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={messages.filters.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </label>
          <label className="ui-filter-chip max-w-full" data-active={productFilterId ? 'true' : 'false'}>
            <span>{messages.filters.productLabel}</span>
            <select
              value={productFilterId}
              onChange={(event) => setProductFilterId(event.target.value)}
              disabled={productsLookupUnavailable}
              className="max-w-[12rem] truncate bg-transparent font-medium text-[var(--ink)] outline-none"
            >
              {productOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="ui-filter-chip max-w-full" data-active={movementTypeFilter ? 'true' : 'false'}>
            <span>{messages.filters.directionLabel}</span>
            <select
              value={movementTypeFilter}
              onChange={(event) => setMovementTypeFilter(event.target.value)}
              className="max-w-[12rem] truncate bg-transparent font-medium text-[var(--ink)] outline-none"
            >
              {movementTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="ui-secondary-button">{messages.filters.searchLabel}</button>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setProductFilterId('');
                setMovementTypeFilter('');
              }}
              className="inline-flex min-h-9 items-center gap-1 px-1 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {messages.filters.clear}
            </button>
          ) : null}
        </form>

        <PetLookupFeedback issues={lookupIssues} />

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.inventory.update' : 'pet.inventory.create'}>
            <section
              id="pet-inventory-editor"
              aria-labelledby="pet-inventory-editor-title"
              className="scroll-mt-4 rounded-md border border-[color:var(--line)] p-4"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="pet-inventory-editor-title" className="text-sm font-semibold text-[var(--ink)]">
                    {editingId ? messages.form.editTitle : messages.form.createTitle}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{messages.form.description}</p>
                </div>

                <FormSection title={messages.form.sectionMovement}>
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
                    min="1"
                    required
                  />
                  <FormInput
                    label={messages.form.noteLabel}
                    value={notes}
                    onChange={setNotes}
                    placeholder={messages.form.notePlaceholder}
                  />
                </FormSection>

                {productsLookupUnavailable ? (
                  <div className="ui-notice-warning">{messages.lookup.movementWarning}</div>
                ) : null}

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting || productsLookupUnavailable}
                    className="ui-primary-button"
                  >
                    {submitting ? messages.form.saving : editingId ? messages.form.update : messages.form.create}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    {messages.form.cancel}
                  </button>
                </div>
              </form>
            </section>
          </PermissionGuard>
        ) : null}

        <section aria-labelledby="pet-inventory-ledger-title" className="space-y-2">
          <h2 id="pet-inventory-ledger-title" className="text-sm font-semibold text-[var(--ink)]">{messages.ledger.title}</h2>
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
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => void load(page, search, productFilterId, movementTypeFilter)}
          />
        </section>

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
