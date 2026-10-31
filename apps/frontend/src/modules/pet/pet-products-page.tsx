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
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

const pageSize = 10;

const initialPage: PageResponse<PetProduct> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function buildCategoryOptions(copy: AppMessages['screens']['petProducts']) {
  return [
    { value: 'PET_RETAIL_GOOD', label: copy.categoryRetail },
    { value: 'PET_VETERINARY_SUPPLY', label: copy.categoryVeterinary }
  ];
}

export function PetProductsPage() {
  const copy = useAppMessages().screens.petProducts;
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
      setError(resolveApiErrorMessage(err, copy.loadError));
    } finally {
      setLoading(false);
    }
  }, [copy]);

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
      setError(copy.invalidValues);
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
        setSuccess(copy.updated);
      } else {
        await petService.createProduct(payload);
        setSuccess(copy.created);
      }
      resetForm();
      await load(pageData.page, search);
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
      await petService.deleteProduct(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(copy.deleted);
      await load(pageData.page, search);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.deleteError));
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
      label: copy.metricProducts,
      value: totalItems,
      trend: activeFilterCount > 0
        ? copy.metricProductsFiltered
        : copy.metricProductsAll
    },
    {
      key: 'visible-stock-units',
      label: copy.metricStock,
      value: totalVisibleUnits,
      trend: copy.metricStockDetail
    },
    {
      key: 'low-stock-products',
      label: copy.metricLowStock,
      value: lowStockCount,
      trend: copy.metricLowStockDetail
    },
    {
      key: 'product-filters',
      label: copy.metricFilters,
      value: activeFilterCount,
      trend: activeFilterCount > 0
        ? copy.metricFiltersActive
        : copy.metricFiltersNone
    }
  ];

  const columns: DataTableColumn<PetProduct>[] = [
    {
      key: 'product',
      header: copy.columnProduct,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">SKU {item.sku}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: copy.category,
      render: (item) => item.category === 'PET_VETERINARY_SUPPLY' ? copy.categoryVeterinary : copy.categoryRetail
    },
    {
      key: 'price',
      header: copy.price,
      render: (item) => item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      key: 'inventory',
      header: copy.columnInventory,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {item.currentQuantity} {item.unitOfMeasure}
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {copy.minimumShort} {item.minimumQuantity} {copy.reorderAt} {item.reorderPoint}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: copy.actions,
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.product.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              {copy.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.product.delete">
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
      permission="pet.product.read"
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="Gestão Pet"
          title={copy.title}
          description={copy.description}
          actions={(
            <PermissionGuard permission="pet.product.create">
              <button type="button" onClick={beginCreateProduct} className="ui-primary-button">
                {copy.addProduct}
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
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)] xl:items-end">
              <SearchBar
                label={copy.search}
                value={searchInput}
                onChange={setSearchInput}
                placeholder={copy.searchPlaceholder}
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
                }}
                className="ui-inline-button"
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

        <PermissionGuard permission={editingId ? 'pet.product.update' : 'pet.product.create'}>
          <div id="pet-product-form-section">
            <PageSection
              title={editingId ? copy.editProduct : copy.createProduct}
              description={copy.formDescription}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  <FormInput label={copy.name} value={name} onChange={setName} required />
                  <FormInput label="SKU" value={sku} onChange={setSku} required />
                  <FormSelect label={copy.category} value={category} options={buildCategoryOptions(copy)} onChange={setCategory} />
                  <FormInput label={copy.price} value={price} onChange={setPrice} type="number" required />
                  <FormInput label={copy.currentQuantity} value={stockQuantity} onChange={setStockQuantity} type="number" required />
                  <FormInput label={copy.unit} value={unitOfMeasure} onChange={setUnitOfMeasure} required />
                  <FormInput label={copy.minimumQuantity} value={minimumQuantity} onChange={setMinimumQuantity} type="number" required />
                  <FormInput label={copy.reorderPoint} value={reorderPoint} onChange={setReorderPoint} type="number" required />
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? copy.saving : editingId ? copy.updateProduct : copy.createProduct}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="ui-secondary-button"
                  >
                    {editingId ? copy.cancelEdit : copy.resetForm}
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
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">{copy.total} {totalItems} {copy.productsCount}</p>}
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
                  <PermissionGuard permission="pet.product.create">
                    <button type="button" onClick={beginCreateProduct} className="ui-primary-button">
                      {copy.createFirst}
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
          title={copy.deleteConfirmTitle}
          description={deleteCandidate ? copy.deleteConfirmDescription.replace('{name}', deleteCandidate.name) : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
