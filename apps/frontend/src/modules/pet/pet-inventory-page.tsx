'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetInventoryMovement, PetProduct } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const movementTypeOptions = [
  { value: '', label: 'Todos' },
  { value: 'IN', label: 'IN' },
  { value: 'OUT', label: 'OUT' }
];

const formMovementTypeOptions = movementTypeOptions.filter((item) => item.value);

const initialPage: PageResponse<PetInventoryMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function PetInventoryPage() {
  const [pageData, setPageData] = useState<PageResponse<PetInventoryMovement>>(initialPage);
  const [products, setProducts] = useState<PetProduct[]>([]);
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

  const productOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...products.map((item) => ({ value: item.id, label: `${item.name} (${item.stockQuantity})` }))
    ];
  }, [products]);

  const formProductOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um produto' },
      ...products.map((item) => ({ value: item.id, label: `${item.name} (${item.stockQuantity})` }))
    ];
  }, [products]);

  const loadProducts = useCallback(async () => {
    try {
      const result = await petService.listProducts(0, 200, '');
      setProducts(resolvePageItems(result));
    } catch {
      setProducts([]);
    }
  }, []);

  const load = useCallback(async (page: number, currentSearch: string, currentProductId: string, currentMovementType: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listInventoryMovements(page, pageSize, currentSearch, {
        productId: currentProductId || undefined,
        movementType: currentMovementType || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar movimentações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    load(0, search, productFilterId, movementTypeFilter);
  }, [load, search, productFilterId, movementTypeFilter]);

  function resetForm() {
    setEditingId(null);
    setProductId('');
    setMovementType('IN');
    setQuantity('1');
    setNotes('');
  }

  function beginEdit(item: PetInventoryMovement) {
    setEditingId(item.id);
    setProductId(item.productId);
    setMovementType(item.movementType);
    setQuantity(String(item.quantity));
    setNotes(item.notes ?? '');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);
    if (!productId || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      setError('Selecione um produto e informe uma quantidade válida.');
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
        setSuccess('Movimentação atualizada com sucesso.');
      } else {
        await petService.createInventoryMovement(payload);
        setSuccess('Movimentação criada com sucesso.');
      }

      resetForm();
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar movimentação.');
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
      setSuccess('Movimentação removida com sucesso.');
      await Promise.all([
        load(pageData.page, search, productFilterId, movementTypeFilter),
        loadProducts()
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir movimentação.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<PetInventoryMovement>[] = [
    {
      key: 'createdAt',
      header: 'Data',
      render: (item) => new Date(item.createdAt).toLocaleString('pt-BR')
    },
    {
      key: 'product',
      header: 'Produto',
      render: (item) => products.find((entry) => entry.id === item.productId)?.name ?? item.productId
    },
    { key: 'movementType', header: 'Tipo', render: (item) => item.movementType },
    { key: 'quantity', header: 'Quantidade', render: (item) => String(item.quantity) },
    { key: 'notes', header: 'Notas', render: (item) => item.notes ?? '-' },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.inventory.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.inventory.delete">
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
      permission="pet.inventory.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o estoque.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Pet Inventory" description="Movimentações de estoque com atualização do snapshot do produto." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_160px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Tipo ou notas" />
          <FormSelect label="Produto" value={productFilterId} options={productOptions} onChange={setProductFilterId} />
          <FormSelect label="Tipo" value={movementTypeFilter} options={movementTypeOptions} onChange={setMovementTypeFilter} />
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
              setProductFilterId('');
              setMovementTypeFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'pet.inventory.update' : 'pet.inventory.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormSelect label="Produto" value={productId} options={formProductOptions} onChange={setProductId} />
            <FormSelect label="Tipo" value={movementType} options={formMovementTypeOptions} onChange={setMovementType} />
            <FormInput label="Quantidade" value={quantity} onChange={setQuantity} type="number" required />
            <FormInput label="Notas" value={notes} onChange={setNotes} />

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar movimentação' : 'Criar movimentação'}
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

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma movimentação encontrada." />
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(page) => load(page, search, productFilterId, movementTypeFilter)}
        />

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir movimentação?"
          description="O estoque do produto será recalculado automaticamente."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
