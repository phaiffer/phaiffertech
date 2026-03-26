'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
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
import { DashboardSummaryCard } from '@/shared/types/dashboard';
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

const movementTypeOptions = [
  { value: '', label: 'All movement types' },
  { value: 'IN', label: 'Inbound' },
  { value: 'OUT', label: 'Outbound' }
];

const formMovementTypeOptions = movementTypeOptions.filter((item) => item.value);

const initialPage: PageResponse<PetInventoryMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function formatMovementType(value: string) {
  return value === 'IN' ? 'Inbound' : value === 'OUT' ? 'Outbound' : value;
}

function formatMovementSource(value?: string | null) {
  switch (value) {
    case 'MANUAL':
      return 'Manual adjustment';
    case 'PET_RETAIL_SALE':
      return 'Retail sale';
    case 'PET_CLINIC_CONSUMPTION':
      return 'Clinical consumption';
    case 'PET_PRODUCT_SYNC':
      return 'Product catalog sync';
    case 'IOT_MAINTENANCE_CONSUMPTION':
      return 'Operational consumption';
    case 'IOT_PART_REPLACEMENT':
      return 'Stock replacement';
    case 'IOT_PART_SYNC':
      return 'Catalog sync';
    default:
      return value ?? 'Unknown source';
  }
}

function resolveStockHealth(product: PetProduct) {
  if (product.currentQuantity <= product.minimumQuantity) {
    return {
      label: 'Critical',
      status: 'alert',
      detail: `Below minimum ${product.minimumQuantity} ${product.unitOfMeasure}.`
    };
  }

  if (product.currentQuantity <= product.reorderPoint) {
    return {
      label: 'Reorder soon',
      status: 'warn',
      detail: `At or below reorder point ${product.reorderPoint} ${product.unitOfMeasure}.`
    };
  }

  return {
    label: 'Healthy',
    status: 'ok',
    detail: 'Stock is currently above the replenishment threshold.'
  };
}

export function PetInventoryPage() {
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

  const productOptions = useMemo(() => ([
    { value: '', label: 'All products' },
    ...products.map((item) => ({ value: item.id, label: `${item.name} (${item.currentQuantity ?? item.stockQuantity})` }))
  ]), [products]);

  const formProductOptions = useMemo(() => ([
    { value: '', label: 'Select a product' },
    ...products.map((item) => ({ value: item.id, label: `${item.name} (${item.currentQuantity ?? item.stockQuantity})` }))
  ]), [products]);

  const loadProducts = useCallback(async () => {
    if (!canReadProducts) {
      setProducts([]);
      setLookupIssues([{
        key: 'products',
        label: 'Products',
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
        label: 'Products',
        message: resolvePetLookupIssue(err)
      }]);
    }
  }, [canReadProducts]);

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
      setError(err instanceof ApiClientError ? err.message : 'Unable to load inventory movements.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'catalog-products',
      label: 'Products tracked',
      value: products.length,
      trend: 'Current catalog entries connected to the shared inventory foundation.'
    },
    {
      key: 'critical-products',
      label: 'Below minimum',
      value: criticalLowStockProducts.length,
      trend: criticalLowStockProducts.length > 0
        ? 'These products are already below the minimum quantity.'
        : 'No product is currently below the minimum threshold.'
    },
    {
      key: 'reorder-products',
      label: 'Reorder now',
      value: lowStockProducts.length,
      trend: lowStockProducts.length > 0
        ? 'These products are already at or below the replenishment point.'
        : 'No product is currently at the reorder point.'
    },
    {
      key: 'outbound-movements',
      label: 'Outbound movements',
      value: outboundMovementsOnPage,
      trend: activeFilterCount > 0
        ? 'Count reflects the filtered operational view.'
        : `Visible stock movement quantity on this page: ${movedUnitsOnPage} unit(s).`
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
      setError('Select a product and enter a valid quantity.');
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
        setSuccess('Inventory movement updated successfully.');
      } else {
        await petService.createInventoryMovement(payload);
        setSuccess('Inventory movement created successfully.');
      }

      resetForm();
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save the inventory movement.');
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
      setSuccess('Inventory movement removed successfully.');
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected movement.');
    }
  }

  const columns: DataTableColumn<PetInventoryMovement>[] = [
    {
      key: 'createdAt',
      header: 'Recorded',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {new Date(item.createdAt).toLocaleString('pt-BR')}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Updated {new Date(item.updatedAt).toLocaleString('pt-BR')}</p>
        </div>
      )
    },
    {
      key: 'product',
      header: 'Product',
      render: (item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const stockHealth = product ? resolveStockHealth(product) : null;

        return (
          <div>
            <p className="font-medium text-[color:var(--app-shell-heading)]">
              {item.productName
                ? (item.productSku ? `${item.productName} (${item.productSku})` : item.productName)
                : resolvePetLookupLabel(products, item.productId, (entry) => entry.name, 'Product', productsLookupUnavailable)}
            </p>
            {product ? (
              <p className={`mt-1 ${sharedCompactTextClass}`}>
                Stock {product.currentQuantity} {product.unitOfMeasure} • Reorder at {product.reorderPoint}
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
      header: 'Movement',
      render: (item) => (
        <div>
          <StatusBadge status={item.movementType === 'IN' ? 'active' : 'warn'} />
          <p className={`mt-2 ${sharedCompactTextClass}`}>
            {formatMovementType(item.movementType)} {item.quantity} unit{item.quantity === 1 ? '' : 's'}
          </p>
        </div>
      )
    },
    {
      key: 'sourceType',
      header: 'Source',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {formatMovementSource(item.sourceType)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.reason ?? item.notes ?? 'No operational note recorded.'}
          </p>
        </div>
      )
    },
    {
      key: 'balance',
      header: 'Balance impact',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {item.quantityBefore} to {item.quantityAfter}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            This movement changed the visible on-hand quantity by {item.quantity}.
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.inventory.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.inventory.delete">
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
      permission="pet.inventory.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view PetFlow inventory.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow operations"
          title="Stock & Replenishment"
          description="Keep bath, grooming, and retail stock visible with minimum alerts, reorder context, and movement history the team can trust."
          actions={(
            <div className="flex flex-wrap gap-3">
              <Link href="/pet/products" className="ui-secondary-button">
                Open products
              </Link>
              <PermissionGuard permission="pet.inventory.create">
                <button type="button" onClick={beginCreateMovement} className="ui-primary-button">
                  Record movement
                </button>
              </PermissionGuard>
            </div>
          )}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-3" />

        <PageSection
          tone="muted"
          title="Stock health watchlist"
          description="Keep the most important replenishment risks visible before they become missed services, canceled sales, or rushed purchases."
        >
          {productsLookupUnavailable ? (
            <div className="ui-notice-warning">
              Product lookup access is required to calculate stock health and low-stock signals.
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="ui-notice-neutral">
              No product is currently below the reorder point. The shared inventory catalog looks operationally healthy right now.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {lowStockProducts.slice(0, 6).map((product) => {
                const stockHealth = resolveStockHealth(product);
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
                      Minimum {product.minimumQuantity} • Reorder at {product.reorderPoint}
                    </p>
                    <p className={`mt-2 ${sharedCompactTextClass}`}>{stockHealth.detail}</p>
                  </div>
                );
              })}
            </div>
          )}

          {criticalLowStockProducts.length > 0 ? (
            <div className="ui-notice-warning mt-5">
              {criticalLowStockProducts.length} product{criticalLowStockProducts.length === 1 ? '' : 's'} already fell below the minimum quantity threshold.
            </div>
          ) : null}
        </PageSection>

        <PageSection
          tone="muted"
          title="Inventory filters"
          description="Slice the movement ledger by product or direction while keeping the operational context attached to each change."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.8fr)] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Reason, note, source, or product"
              />
              <FormSelect
                label="Product"
                value={productFilterId}
                options={productOptions}
                onChange={setProductFilterId}
                disabled={productsLookupUnavailable}
              />
              <FormSelect
                label="Direction"
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
                Apply filters
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
                Clear filters
              </button>
            </div>
          </div>
        </PageSection>

        <PetLookupFeedback issues={lookupIssues} />

        <div id="pet-inventory-form-section">
          <PageSection
            title={editingId ? 'Adjust stock movement' : 'Record stock movement'}
            description="Capture the operational reason behind each stock change so inventory discussions stay grounded in a real business event."
          >
            <PermissionGuard permission={editingId ? 'pet.inventory.update' : 'pet.inventory.create'}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label="Product"
                    value={productId}
                    options={formProductOptions}
                    onChange={setProductId}
                    disabled={productsLookupUnavailable}
                  />
                  <FormSelect
                    label="Direction"
                    value={movementType}
                    options={formMovementTypeOptions}
                    onChange={setMovementType}
                  />
                  <FormInput
                    label="Quantity"
                    value={quantity}
                    onChange={setQuantity}
                    type="number"
                    required
                  />
                  <FormInput
                    label="Operational note"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Retail sale, clinical usage, manual count correction..."
                  />
                </div>

                <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4">
                  <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Operator reminder</p>
                  <p className={`mt-1 ${sharedCompactTextClass}`}>
                    Keep the movement reason explicit so reception, stock control, and billing stay aligned during the demo.
                  </p>
                </div>

                {productsLookupUnavailable ? (
                  <div className="ui-notice-warning">
                    Product lookup access is required before recording stock movement safely.
                  </div>
                ) : null}

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting || productsLookupUnavailable}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Saving movement...' : editingId ? 'Update movement' : 'Create movement'}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ui-secondary-button"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </PermissionGuard>
          </PageSection>
        </div>

        <PageSection
          title="Inventory ledger"
          description="Review what changed, why it changed, and how it affected the visible on-hand balance for the selected product set."
        >
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            loading={loading}
            loadingTitle="Loading inventory operations"
            loadingDescription="Preparing the most recent shared inventory movement history for this PetFlow workspace."
            emptyState={{
              title: 'No inventory movement recorded yet',
              description: 'Record the first stock adjustment to make product availability and replenishment conversations operationally real.',
              action: (
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/pet/products" className="ui-secondary-button">
                    Open products
                  </Link>
                  {hasPermission('pet.inventory.create') ? (
                    <button type="button" onClick={beginCreateMovement} className="ui-primary-button">
                      Record first movement
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
          title="Delete movement?"
          description="The product stock will be recalculated automatically after this inventory movement is removed."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
