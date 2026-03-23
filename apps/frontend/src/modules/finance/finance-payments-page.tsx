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
import { FinancePayment } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 20;

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' }
];

const methodOptions = [
  { value: '', label: 'All methods' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'BANK_TRANSFER', label: 'Transferência bancária' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'MANUAL', label: 'Ajuste manual' },
  { value: 'OTHER', label: 'Outro' }
];

const initialPage: PageResponse<FinancePayment> = {
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

function resolveMethodLabel(method: string) {
  return methodOptions.find((o) => o.value === method)?.label ?? method;
}

const columns: DataTableColumn<FinancePayment>[] = [
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
    key: 'invoiceId',
    header: 'Fatura',
    render: (row) => (
      <span className={`${sharedCompactTextClass} font-mono text-xs`} title={row.invoiceId}>
        {row.invoiceId.slice(0, 8)}…
      </span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />
  },
  {
    key: 'method',
    header: 'Método',
    render: (row) => (
      <span className={sharedCompactTextClass}>{resolveMethodLabel(row.method)}</span>
    )
  },
  {
    key: 'amount',
    header: 'Valor',
    render: (row) => (
      <span className="text-sm font-medium text-foreground">
        {formatCurrency(row.amount, row.currency)}
      </span>
    )
  },
  {
    key: 'paidAt',
    header: 'Data de pagamento',
    render: (row) => <span className={sharedCompactTextClass}>{formatDateTime(row.paidAt)}</span>
  },
  {
    key: 'referenceCode',
    header: 'Referência',
    render: (row) => (
      <span className={`${sharedCompactTextClass} font-mono text-xs`}>
        {row.referenceCode ?? '—'}
      </span>
    )
  }
];

export function FinancePaymentsPage() {
  const [pageData, setPageData] = useState<PageResponse<FinancePayment>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const load = useCallback(
    async (page: number, currentStatus: string, currentMethod: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await financeService.listPayments(page, pageSize, {
          status: currentStatus || undefined,
          method: currentMethod || undefined
        });
        setPageData(data);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar pagamentos.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(0, statusFilter, methodFilter);
  }, [load, statusFilter, methodFilter]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        title="Pagamentos"
        eyebrow="Finance"
        description="Registro de todos os pagamentos processados pela plataforma."
      />

      <PageSection title="Filtros">
        <div className={`${sharedFilterToolbarClass} sm:grid-cols-2`}>
          <FormSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
          <FormSelect
            label="Método"
            value={methodFilter}
            onChange={setMethodFilter}
            options={methodOptions}
          />
        </div>
      </PageSection>

      <PageSection
        title="Pagamentos"
        description={
          loading
            ? 'Carregando…'
            : `${totalItems} pagamento${totalItems !== 1 ? 's' : ''} encontrado${totalItems !== 1 ? 's' : ''}`
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
          onPageChange={(p) => void load(p, statusFilter, methodFilter)}
        />
      </PageSection>
    </div>
  );
}
