'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotPart, IotPartMovement } from '@/shared/types/iot';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPartPage: PageResponse<IotPart> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const initialMovementPage: PageResponse<IotPartMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const categoryOptions = [
  { value: '', label: 'Todas as categorias' },
  { value: 'IOT_SPARE_PART', label: 'Peça de reposição' },
  { value: 'IOT_CONSUMABLE', label: 'Consumível' }
];

const formCategoryOptions = categoryOptions.filter((option) => option.value);

const movementTypeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'IN', label: 'Entrada' },
  { value: 'OUT', label: 'Saída' }
];

const formMovementTypeOptions = movementTypeOptions.filter((option) => option.value);

export function IotPartsPage() {
  const [partsPage, setPartsPage] = useState<PageResponse<IotPart>>(initialPartPage);
  const [movementsPage, setMovementsPage] = useState<PageResponse<IotPartMovement>>(initialMovementPage);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [partSearchInput, setPartSearchInput] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [movementSearchInput, setMovementSearchInput] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementPartFilter, setMovementPartFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('IOT_SPARE_PART');
  const [unitOfMeasure, setUnitOfMeasure] = useState('UNIT');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [minimumQuantity, setMinimumQuantity] = useState('0');
  const [reorderPoint, setReorderPoint] = useState('5');
  const [description, setDescription] = useState('');
  const [submittingPart, setSubmittingPart] = useState(false);

  const [movementPartId, setMovementPartId] = useState('');
  const [movementType, setMovementType] = useState('OUT');
  const [movementQuantity, setMovementQuantity] = useState('1');
  const [maintenanceId, setMaintenanceId] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [submittingMovement, setSubmittingMovement] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotPart | null>(null);

  const loadParts = useCallback(async (page: number, search: string, currentCategory: string) => {
    setLoadingParts(true);
    setError(null);
    try {
      const result = await iotService.listParts(page, pageSize, search, {
        category: currentCategory || undefined
      });
      setPartsPage(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar peças IoT.');
    } finally {
      setLoadingParts(false);
    }
  }, []);

  const loadMovements = useCallback(async (page: number, search: string, partId: string, currentType: string) => {
    setLoadingMovements(true);
    setError(null);
    try {
      const result = await iotService.listPartMovements(page, pageSize, search, {
        partId: partId || undefined,
        movementType: currentType || undefined
      });
      setMovementsPage(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar movimentos de peças.');
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  useEffect(() => {
    void loadParts(0, partSearch, categoryFilter);
  }, [categoryFilter, loadParts, partSearch]);

  useEffect(() => {
    void loadMovements(0, movementSearch, movementPartFilter, movementTypeFilter);
  }, [loadMovements, movementPartFilter, movementSearch, movementTypeFilter]);

  const partOptions = useMemo(
    () => [
      { value: '', label: 'Todas as peças' },
      ...resolvePageItems(partsPage).map((part) => ({ value: part.id, label: `${part.name} (${part.currentQuantity})` }))
    ],
    [partsPage]
  );

  const formPartOptions = useMemo(
    () => [
      { value: '', label: 'Selecione uma peça' },
      ...resolvePageItems(partsPage).map((part) => ({ value: part.id, label: `${part.name} (${part.currentQuantity})` }))
    ],
    [partsPage]
  );

  function resetPartForm() {
    setEditingPartId(null);
    setName('');
    setSku('');
    setCategory('IOT_SPARE_PART');
    setUnitOfMeasure('UNIT');
    setCurrentQuantity('0');
    setMinimumQuantity('0');
    setReorderPoint('5');
    setDescription('');
  }

  function beginEdit(part: IotPart) {
    setEditingPartId(part.id);
    setName(part.name);
    setSku(part.sku);
    setCategory(part.category);
    setUnitOfMeasure(part.unitOfMeasure);
    setCurrentQuantity(String(part.currentQuantity));
    setMinimumQuantity(String(part.minimumQuantity));
    setReorderPoint(String(part.reorderPoint));
    setDescription(part.description ?? '');
    setError(null);
    setSuccess(null);
  }

  async function handlePartSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedCurrent = Number(currentQuantity);
    const parsedMinimum = Number(minimumQuantity);
    const parsedReorder = Number(reorderPoint);
    if (
      Number.isNaN(parsedCurrent) ||
      Number.isNaN(parsedMinimum) ||
      Number.isNaN(parsedReorder) ||
      parsedCurrent < 0 ||
      parsedMinimum < 0 ||
      parsedReorder < parsedMinimum
    ) {
      setError('Revise quantidade atual, mínimo e ponto de reposição.');
      return;
    }

    setSubmittingPart(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        sku,
        category,
        unitOfMeasure,
        currentQuantity: parsedCurrent,
        minimumQuantity: parsedMinimum,
        reorderPoint: parsedReorder,
        description: description || undefined
      };

      if (editingPartId) {
        await iotService.updatePart(editingPartId, payload);
        setSuccess('Peça IoT atualizada com sucesso.');
      } else {
        await iotService.createPart(payload);
        setSuccess('Peça IoT criada com sucesso.');
      }

      resetPartForm();
      await Promise.all([
        loadParts(partsPage.page, partSearch, categoryFilter),
        loadMovements(movementsPage.page, movementSearch, movementPartFilter, movementTypeFilter)
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar peça IoT.');
    } finally {
      setSubmittingPart(false);
    }
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(movementQuantity);
    if (!movementPartId || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      setError('Selecione uma peça e informe uma quantidade válida.');
      return;
    }

    setSubmittingMovement(true);
    setError(null);
    setSuccess(null);

    try {
      await iotService.createPartMovement(movementPartId, {
        movementType,
        quantity: parsedQuantity,
        maintenanceId: maintenanceId || undefined,
        reason: movementReason || undefined
      });

      setMovementPartId('');
      setMovementType('OUT');
      setMovementQuantity('1');
      setMaintenanceId('');
      setMovementReason('');
      setSuccess('Movimento de estoque registrado com sucesso.');

      await Promise.all([
        loadParts(partsPage.page, partSearch, categoryFilter),
        loadMovements(movementsPage.page, movementSearch, movementPartFilter, movementTypeFilter)
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao registrar movimento de peça.');
    } finally {
      setSubmittingMovement(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await iotService.deletePart(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Peça IoT removida com sucesso.');
      await Promise.all([
        loadParts(partsPage.page, partSearch, categoryFilter),
        loadMovements(movementsPage.page, movementSearch, movementPartFilter, movementTypeFilter)
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir peça IoT.');
    }
  }

  const partColumns: DataTableColumn<IotPart>[] = [
    { key: 'name', header: 'Peça', render: (item) => item.name },
    { key: 'sku', header: 'SKU', render: (item) => item.sku },
    {
      key: 'category',
      header: 'Categoria',
      render: (item) => item.category === 'IOT_CONSUMABLE' ? 'Consumível' : 'Reposição'
    },
    { key: 'unitOfMeasure', header: 'Unid.', render: (item) => item.unitOfMeasure },
    { key: 'currentQuantity', header: 'Atual', render: (item) => String(item.currentQuantity) },
    { key: 'minimumQuantity', header: 'Mínimo', render: (item) => String(item.minimumQuantity) },
    { key: 'reorderPoint', header: 'Reposição', render: (item) => String(item.reorderPoint) },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="iot.part.update">
            <button type="button" onClick={() => beginEdit(item)} className="ui-inline-button">
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="iot.part.delete">
            <button type="button" onClick={() => setDeleteCandidate(item)} className="ui-inline-danger-button">
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  const movementColumns: DataTableColumn<IotPartMovement>[] = [
    {
      key: 'createdAt',
      header: 'Data',
      render: (item) => new Date(item.createdAt).toLocaleString('pt-BR')
    },
    {
      key: 'part',
      header: 'Peça',
      render: (item) => item.partName && item.partSku ? `${item.partName} (${item.partSku})` : item.partName ?? item.partId
    },
    { key: 'movementType', header: 'Tipo', render: (item) => item.movementType },
    { key: 'quantity', header: 'Quantidade', render: (item) => String(item.quantity) },
    { key: 'sourceType', header: 'Origem', render: (item) => item.sourceType },
    { key: 'reason', header: 'Motivo', render: (item) => item.reason },
    {
      key: 'balance',
      header: 'Saldo',
      render: (item) => `${item.quantityBefore} -> ${item.quantityAfter}`
    }
  ];

  return (
    <PermissionGuard
      permission="iot.part.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar peças IoT.</div>}
    >
      <div className="space-y-6">
        <PageTitle
          title="IoT Parts"
          description="Peças de reposição e consumíveis industriais sobre a mesma fundação compartilhada de estoque."
        />

        <div className="space-y-3 ui-surface-panel p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px_auto_auto]">
            <SearchBar value={partSearchInput} onChange={setPartSearchInput} placeholder="Nome, SKU ou descrição" />
            <FormSelect label="Categoria" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
            <button type="button" onClick={() => setPartSearch(partSearchInput)} className="ui-primary-button">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setPartSearchInput('');
                setPartSearch('');
                setCategoryFilter('');
              }}
              className="ui-secondary-button"
            >
              Limpar
            </button>
          </div>

          <PermissionGuard permission={editingPartId ? 'iot.part.update' : 'iot.part.create'}>
            <form onSubmit={handlePartSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <FormInput label="Nome" value={name} onChange={setName} required />
              <FormInput label="SKU" value={sku} onChange={setSku} required />
              <FormSelect label="Categoria" value={category} options={formCategoryOptions} onChange={setCategory} />
              <FormInput label="Unidade" value={unitOfMeasure} onChange={setUnitOfMeasure} required />
              <FormInput label="Quantidade atual" value={currentQuantity} onChange={setCurrentQuantity} type="number" required />
              <FormInput label="Quantidade mínima" value={minimumQuantity} onChange={setMinimumQuantity} type="number" required />
              <FormInput label="Ponto de reposição" value={reorderPoint} onChange={setReorderPoint} type="number" required />
              <FormInput label="Descrição" value={description} onChange={setDescription} />

              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                <button type="submit" disabled={submittingPart} className="ui-primary-button">
                  {submittingPart ? 'Salvando...' : editingPartId ? 'Atualizar peça' : 'Criar peça'}
                </button>
                {editingPartId ? (
                  <button type="button" onClick={resetPartForm} className="ui-secondary-button">
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </PermissionGuard>
        </div>

        <div className="space-y-3 ui-surface-panel p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px_160px_auto_auto]">
            <SearchBar value={movementSearchInput} onChange={setMovementSearchInput} placeholder="Motivo ou origem" />
            <FormSelect label="Peça" value={movementPartFilter} options={partOptions} onChange={setMovementPartFilter} />
            <FormSelect label="Tipo" value={movementTypeFilter} options={movementTypeOptions} onChange={setMovementTypeFilter} />
            <button type="button" onClick={() => setMovementSearch(movementSearchInput)} className="ui-primary-button">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setMovementSearchInput('');
                setMovementSearch('');
                setMovementPartFilter('');
                setMovementTypeFilter('');
              }}
              className="ui-secondary-button"
            >
              Limpar
            </button>
          </div>

          <PermissionGuard permission="iot.part.update">
            <form onSubmit={handleMovementSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <FormSelect label="Peça" value={movementPartId} options={formPartOptions} onChange={setMovementPartId} />
              <FormSelect label="Tipo" value={movementType} options={formMovementTypeOptions} onChange={setMovementType} />
              <FormInput label="Quantidade" value={movementQuantity} onChange={setMovementQuantity} type="number" required />
              <FormInput label="Maintenance ID" value={maintenanceId} onChange={setMaintenanceId} />
              <FormInput label="Motivo" value={movementReason} onChange={setMovementReason} />

              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                <button type="submit" disabled={submittingMovement} className="ui-primary-button">
                  {submittingMovement ? 'Registrando...' : 'Registrar movimento'}
                </button>
              </div>
            </form>
          </PermissionGuard>
        </div>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <div className="space-y-3">
          <DataTable
            columns={partColumns}
            rows={resolvePageItems(partsPage)}
            getRowKey={(row) => row.id}
            loading={loadingParts}
            emptyMessage="Nenhuma peça IoT encontrada."
          />
          <Pagination
            page={partsPage.page}
            totalPages={partsPage.totalPages}
            totalElements={resolveTotalItems(partsPage)}
            onPageChange={(page) => loadParts(page, partSearch, categoryFilter)}
          />
        </div>

        <div className="space-y-3">
          <DataTable
            columns={movementColumns}
            rows={resolvePageItems(movementsPage)}
            getRowKey={(row) => row.id}
            loading={loadingMovements}
            emptyMessage="Nenhum movimento de peça encontrado."
          />
          <Pagination
            page={movementsPage.page}
            totalPages={movementsPage.totalPages}
            totalElements={resolveTotalItems(movementsPage)}
            onPageChange={(page) => loadMovements(page, movementSearch, movementPartFilter, movementTypeFilter)}
          />
        </div>

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir peça IoT?"
          description={deleteCandidate ? `A peça "${deleteCandidate.name}" será removida.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
