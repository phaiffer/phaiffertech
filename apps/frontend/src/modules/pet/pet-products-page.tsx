'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetProduct } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
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
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProduct | null>(null);

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listProducts(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search);
  }, [load, search]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setSku('');
    setPrice('');
    setStockQuantity('0');
  }

  function beginEdit(item: PetProduct) {
    setEditingId(item.id);
    setName(item.name);
    setSku(item.sku);
    setPrice(String(item.price));
    setStockQuantity(String(item.stockQuantity));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    const parsedStock = Number(stockQuantity);
    if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStock) || parsedStock < 0) {
      setError('Informe preço e estoque válidos.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = { name, sku, price: parsedPrice, stockQuantity: parsedStock };
      if (editingId) {
        await petService.updateProduct(editingId, payload);
        setSuccess('Produto atualizado com sucesso.');
      } else {
        await petService.createProduct(payload);
        setSuccess('Produto criado com sucesso.');
      }
      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar produto.');
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
      setSuccess('Produto removido com sucesso.');
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir produto.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<PetProduct>[] = [
    { key: 'name', header: 'Produto', render: (item) => item.name },
    { key: 'sku', header: 'SKU', render: (item) => item.sku },
    {
      key: 'price',
      header: 'Preço',
      render: (item) => item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { key: 'stockQuantity', header: 'Estoque', render: (item) => String(item.stockQuantity) },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.product.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.product.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.product.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar produtos.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Pet Products" description="Produtos comerciais com SKU, preço e snapshot de estoque." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Nome ou SKU" />
          <button
            type="button"
            onClick={() => setSearch(searchInput)}
            className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'pet.product.update' : 'pet.product.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Nome" value={name} onChange={setName} required />
            <FormInput label="SKU" value={sku} onChange={setSku} required />
            <FormInput label="Preço" value={price} onChange={setPrice} type="number" required />
            <FormInput label="Estoque" value={stockQuantity} onChange={setStockQuantity} type="number" required />

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar produto' : 'Criar produto'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhum produto encontrado." />
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(page) => load(page, search)} />

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir produto?"
          description={deleteCandidate ? `O produto "${deleteCandidate.name}" será removido.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
