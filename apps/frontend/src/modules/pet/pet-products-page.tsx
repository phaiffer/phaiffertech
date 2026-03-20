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
import { PetProduct } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<PetProduct> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const categoryOptions = [
  { value: 'PET_RETAIL_GOOD', label: 'Pet retail product' },
  { value: 'PET_VETERINARY_SUPPLY', label: 'Veterinary supply' }
];

export function PetProductsPage() {
  const [pageData, setPageData] = useState<PageResponse<PetProduct>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [category, setCategory] = useState('PET_RETAIL_GOOD');
  const [unitOfMeasure, setUnitOfMeasure] = useState('UNIT');
  const [minimumQuantity, setMinimumQuantity] = useState('0');
  const [reorderPoint, setReorderPoint] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProduct | null>(null);

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listProducts(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load PetFlow products.');
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
    setSku('');
    setPrice('');
    setStockQuantity('0');
    setCategory('PET_RETAIL_GOOD');
    setUnitOfMeasure('UNIT');
    setMinimumQuantity('0');
    setReorderPoint('5');
  }

  function scrollToProductForm() {
    document.getElementById('pet-product-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function beginCreateProduct() {
    resetForm();
    scrollToProductForm();
  }

  function beginEdit(item: PetProduct) {
    setEditingId(item.id);
    setName(item.name);
    setSku(item.sku);
    setPrice(String(item.price));
    setStockQuantity(String(item.currentQuantity ?? item.stockQuantity));
    setCategory(item.category);
    setUnitOfMeasure(item.unitOfMeasure);
    setMinimumQuantity(String(item.minimumQuantity));
    setReorderPoint(String(item.reorderPoint));
    setError(null);
    setSuccess(null);
    scrollToProductForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    const parsedStock = Number(stockQuantity);
    const parsedMinimum = Number(minimumQuantity);
    const parsedReorderPoint = Number(reorderPoint);
    if (
      Number.isNaN(parsedPrice) ||
      Number.isNaN(parsedStock) ||
      Number.isNaN(parsedMinimum) ||
      Number.isNaN(parsedReorderPoint) ||
      parsedStock < 0 ||
      parsedMinimum < 0 ||
      parsedReorderPoint < parsedMinimum
    ) {
      setError('Enter valid price, stock, and replenishment parameters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        sku,
        price: parsedPrice,
        stockQuantity: parsedStock,
        category,
        unitOfMeasure,
        minimumQuantity: parsedMinimum,
        reorderPoint: parsedReorderPoint
      };
      if (editingId) {
        await petService.updateProduct(editingId, payload);
        setSuccess('Product updated successfully.');
      } else {
        await petService.createProduct(payload);
        setSuccess('Product created successfully.');
      }
      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save the product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteProduct(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Product removed successfully.');
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected product.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search].filter(Boolean).length;
  const lowStockCount = rows.filter((item) => item.currentQuantity <= item.reorderPoint).length;
  const totalVisibleUnits = rows.reduce((total, item) => total + item.currentQuantity, 0);
  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'products-in-scope',
      label: 'Products in scope',
      value: totalItems,
      trend: activeFilterCount > 0
        ? 'Results reflect the current catalog search.'
        : 'Full product catalog for this workspace.'
    },
    {
      key: 'visible-stock-units',
      label: 'Visible stock',
      value: totalVisibleUnits,
      trend: 'Units currently visible in the product view.'
    },
    {
      key: 'low-stock-products',
      label: 'Low stock on page',
      value: lowStockCount,
      trend: 'Products already at or below the replenishment point.'
    },
    {
      key: 'product-filters',
      label: 'Active filters',
      value: activeFilterCount,
      trend: activeFilterCount > 0
        ? 'The catalog is narrowed to a specific search slice.'
        : 'No filters are limiting the current view.'
    }
  ];

  const columns: DataTableColumn<PetProduct>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{item.name}</p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">SKU {item.sku}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => item.category === 'PET_VETERINARY_SUPPLY' ? 'Veterinary supply' : 'Retail product'
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      key: 'inventory',
      header: 'Inventory',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {item.currentQuantity} {item.unitOfMeasure}
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            Min {item.minimumQuantity} • Reorder at {item.reorderPoint}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.product.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.product.delete">
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
      permission="pet.product.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view PetFlow products.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Pet Products"
          description="A more complete product and stock surface for demos, onboarding, and day-to-day replenishment conversations."
          actions={(
            <PermissionGuard permission="pet.product.create">
              <button type="button" onClick={beginCreateProduct} className="ui-primary-button">
                Add product
              </button>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title="Product filters"
          description="Refine the catalog by name or SKU while keeping the entry surface balanced for first-time and demo users."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Product name or SKU"
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
                  ? 'Search is focusing the inventory conversation.'
                  : 'No filters are active. Showing the broader catalog.'}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'pet.product.update' : 'pet.product.create'}>
          <div id="pet-product-form-section">
            <PageSection
              title={editingId ? 'Edit product' : 'Create product'}
              description="Group commercial and replenishment inputs so the catalog feels operational instead of schema-driven."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  <FormInput label="Name" value={name} onChange={setName} required />
                  <FormInput label="SKU" value={sku} onChange={setSku} required />
                  <FormSelect label="Category" value={category} options={categoryOptions} onChange={setCategory} />
                  <FormInput label="Price" value={price} onChange={setPrice} type="number" required />
                  <FormInput label="Current quantity" value={stockQuantity} onChange={setStockQuantity} type="number" required />
                  <FormInput label="Unit of measure" value={unitOfMeasure} onChange={setUnitOfMeasure} required />
                  <FormInput label="Minimum quantity" value={minimumQuantity} onChange={setMinimumQuantity} type="number" required />
                  <FormInput label="Reorder point" value={reorderPoint} onChange={setReorderPoint} type="number" required />
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
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
          title="Product catalog"
          description="The listing keeps category, pricing, and replenishment signals easier to scan during demos and operational reviews."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} product(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Loading products"
              loadingDescription="Preparing the product catalog with inventory and replenishment context."
              emptyState={{
                title: 'No products found',
                description: activeFilterCount > 0
                  ? 'Adjust the search or add a product to complete the catalog for demos and operations.'
                  : 'Create the first product to make stock, services, and invoicing flows feel more complete.',
                action: (
                  <PermissionGuard permission="pet.product.create">
                    <button type="button" onClick={beginCreateProduct} className="ui-primary-button">
                      Create first product
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
          title="Delete product?"
          description={deleteCandidate ? `The product "${deleteCandidate.name}" will be removed from the catalog.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
