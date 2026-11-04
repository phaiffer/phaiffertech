'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedFormActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale } from '@/shared/i18n/formatters';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetProduct } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;

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

function isAtReorderPoint(item: PetProduct) {
  return item.currentQuantity <= item.reorderPoint;
}

export function PetProductsPage() {
  const copy = useAppMessages().screens.petProducts;
  const { locale } = useAppI18n();
  const [pageData, setPageData] = useState<PageResponse<PetProduct>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
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

  function closeEditor() {
    resetForm();
    setIsEditorOpen(false);
  }

  function scrollToEditor() {
    window.requestAnimationFrame(() => {
      document.getElementById('pet-product-editor')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    });
  }

  function beginCreateProduct() {
    resetForm();
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
    scrollToEditor();
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
    setIsEditorOpen(true);
    scrollToEditor();
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
      closeEditor();
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
  const hasActiveFilters = Boolean(search);

  const columns: DataTableColumn<PetProduct>[] = [
    {
      key: 'product',
      header: copy.columnProduct,
      render: (item) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{item.name}</p>
          <p className="ui-mono text-xs text-[var(--muted)]">SKU {item.sku}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: copy.category,
      render: (item) => (
        <span className="text-sm text-[var(--ink-2)]">
          {item.category === 'PET_VETERINARY_SUPPLY' ? copy.categoryVeterinary : copy.categoryRetail}
        </span>
      )
    },
    {
      key: 'price',
      header: copy.price,
      className: 'text-right',
      render: (item) => <span className="ui-mono whitespace-nowrap">{formatCurrencyForLocale(locale, item.price)}</span>
    },
    {
      key: 'inventory',
      header: copy.columnInventory,
      render: (item) => (
        <div className="whitespace-nowrap">
          <p className="ui-mono text-[var(--ink)]">
            {item.currentQuantity} {item.unitOfMeasure}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {copy.minimumShort} {item.minimumQuantity} {copy.reorderAt} {item.reorderPoint}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: copy.columnStatus,
      render: (item) => {
        const needsRestock = isAtReorderPoint(item);
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--ink-2)]">
            <span className="ui-status-dot" data-status={needsRestock ? 'warn' : 'done'} aria-hidden="true" />
            {needsRestock ? copy.statusRestock : copy.statusOk}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: copy.actions,
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <PermissionGuard permission="pet.product.update">
            <button type="button" onClick={() => beginEdit(item)} className="ui-inline-button">
              {copy.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.product.delete">
            <button type="button" onClick={() => setDeleteCandidate(item)} className="ui-inline-danger-button">
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
          title={copy.title}
          count={loading ? undefined : totalItems}
          description={copy.description}
          actions={(
            <PermissionGuard permission="pet.product.create">
              <button type="button" onClick={beginCreateProduct} className="ui-primary-button">
                {copy.addProduct}
              </button>
            </PermissionGuard>
          )}
        />

        <form
          role="search"
          aria-label={copy.search}
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="ui-field-shell flex min-h-9 min-w-[16rem] flex-1 items-center gap-2 rounded-md border border-[color:var(--control)] px-3 md:max-w-md">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            <span className="sr-only">{copy.search}</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </label>
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
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
          <PermissionGuard permission={editingId ? 'pet.product.update' : 'pet.product.create'}>
            <section
              id="pet-product-editor"
              aria-labelledby="pet-product-editor-title"
              className="scroll-mt-4 rounded-md border border-[color:var(--line)] p-4"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="pet-product-editor-title" className="text-sm font-semibold text-[var(--ink)]">
                    {editingId ? copy.editProduct : copy.addProduct}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{copy.formDescription}</p>
                </div>

                <FormSection title={copy.sectionProduct}>
                  <FormInput label={copy.name} value={name} onChange={setName} required />
                  <FormInput label="SKU" value={sku} onChange={setSku} required />
                  <FormSelect label={copy.category} value={category} options={buildCategoryOptions(copy)} onChange={setCategory} />
                  <FormInput label={copy.price} value={price} onChange={setPrice} type="number" step="0.01" min="0" required />
                </FormSection>

                <FormSection title={copy.sectionStock}>
                  <FormInput label={copy.currentQuantity} value={stockQuantity} onChange={setStockQuantity} type="number" min="0" required />
                  <FormInput label={copy.unit} value={unitOfMeasure} onChange={setUnitOfMeasure} required />
                  <FormInput label={copy.minimumQuantity} value={minimumQuantity} onChange={setMinimumQuantity} type="number" min="0" required />
                  <FormInput label={copy.reorderPoint} value={reorderPoint} onChange={setReorderPoint} type="number" min="0" required />
                </FormSection>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting} className="ui-primary-button">
                    {submitting ? copy.saving : editingId ? copy.updateProduct : copy.createProduct}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
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
              description: hasActiveFilters ? copy.emptyFiltered : copy.emptyDescription,
              action: (
                <PermissionGuard permission="pet.product.create">
                  <button type="button" onClick={beginCreateProduct} className="ui-primary-button">
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
            onPageChange={(page) => void load(page, search)}
          />
        </div>

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
