'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { financeService } from '@/shared/services/finance-service';
import { PageResponse } from '@/shared/types/common';
import { FinanceCashMovement } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 20;

const directionOptions = [
  { value: '', label: 'All directions' },
  { value: 'IN', label: 'Entrada' },
  { value: 'OUT', label: 'Saída' }
];

const categoryOptions = [
  { value: '', label: 'All categories' },
  { value: 'PAYMENT', label: 'Pagamento' },
  { value: 'REFUND', label: 'Reembolso' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'FEE', label: 'Taxa' },
  { value: 'OTHER', label: 'Outro' }
];

const initialPage: PageResponse<FinanceCashMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function formatCurrency(value: number, currency = 'BRL') {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDateTime(value?: string | null, fallback = '—') {
  if (!value) return fallback;
  return new Date(value).toLocaleString('pt-BR');
}

function formatLabel(value?: string | null) {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveDirectionLabel(direction: string) {
  if (direction.toUpperCase() === 'IN') return 'Entrada';
  if (direction.toUpperCase() === 'OUT') return 'Saída';
  return formatLabel(direction);
}

const columns: DataTableColumn<FinanceCashMovement>[] = [
  {
    key: 'id',
    header: 'ID',
    render: (row) => (
      <span className={`${sharedCompactTextClass} font-mono text-xs`} title={row.id}>
        {row.id.slice(0, 8)}…
      </span>
    )
  },
  {
    key: 'direction',
    header: 'Direção',
    render: (row) => <StatusBadge status={resolveDirectionLabel(row.direction)} />
  },
  {
    key: 'category',
    header: 'Categoria',
    render: (row) => <span className={sharedCompactTextClass}>{formatLabel(row.category)}</span>
  },
  {
    key: 'amount',
    header: 'Valor',
    render: (row) => (
      <span
        className={`text-sm font-medium ${
          row.direction.toUpperCase() === 'IN' ? 'text-success' : 'text-destructive'
        }`}
      >
        {row.direction.toUpperCase() === 'OUT' ? '−' : '+'}
        {formatCurrency(row.amount, row.currency)}
      </span>
    )
  },
  {
    key: 'occurredAt',
    header: 'Data',
    render: (row) => (
      <span className={sharedCompactTextClass}>{formatDateTime(row.occurredAt)}</span>
    )
  },
  {
    key: 'description',
    header: 'Descrição',
    render: (row) => <span className={sharedCompactTextClass}>{row.description ?? '—'}</span>
  },
  {
    key: 'invoiceId',
    header: 'Fatura',
    render: (row) =>
      row.invoiceId ? (
        <span className={`${sharedCompactTextClass} font-mono text-xs`} title={row.invoiceId}>
          {row.invoiceId.slice(0, 8)}…
        </span>
      ) : (
        <span className={sharedCompactTextClass}>—</span>
      )
  }
];

export function FinanceCashPage() {
  const [pageData, setPageData] = useState<PageResponse<FinanceCashMovement>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [directionFilter, setDirectionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = useCallback(
    async (page: number, currentDirection: string, currentCategory: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await financeService.listCashMovements(page, pageSize, {
          direction: currentDirection || undefined,
          category: currentCategory || undefined
        });
        setPageData(data);
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : 'Erro ao carregar movimentações de caixa.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(0, directionFilter, categoryFilter);
  }, [load, directionFilter, categoryFilter]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        title="Fluxo de Caixa"
        eyebrow="Finance"
        description="Movimentações de entrada e saída consolidadas da plataforma."
      />

      <PageSection title="Filtros">
        <div className={`${sharedFilterToolbarClass} sm:grid-cols-2`}>
          <FormSelect
            label="Direção"
            value={directionFilter}
            onChange={setDirectionFilter}
            options={directionOptions}
          />
          <FormSelect
            label="Categoria"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
        </div>
      </PageSection>

      <PageSection
        title="Movimentações"
        description={
          loading
            ? 'Carregando…'
            : `${totalItems} movimentaç${totalItems !== 1 ? 'ões' : 'ão'} encontrada${totalItems !== 1 ? 's' : ''}`
        }
      >
        {error && (
          <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(row) => row.id}
        />
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(p) => void load(p, directionFilter, categoryFilter)}
        />
      </PageSection>
    </div>
  );
}
