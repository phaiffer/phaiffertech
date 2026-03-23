'use client';

import Link from 'next/link';
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
import { notificationService } from '@/shared/services/notification-service';
import { PageResponse } from '@/shared/types/common';
import { FinanceInvoice } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 20;

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELED', label: 'Canceled' }
];

const sourceModuleOptions = [
  { value: '', label: 'All modules' },
  { value: 'PET', label: 'PetFlow' },
  { value: 'CRM', label: 'CRM' },
  { value: 'MANUAL', label: 'Manual' }
];

const initialPage: PageResponse<FinanceInvoice> = {
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

function formatDate(value?: string | null, fallback = '—') {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString('pt-BR');
}

const columns: DataTableColumn<FinanceInvoice>[] = [
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
    key: 'sourceModule',
    header: 'Módulo',
    render: (row) => <span className={sharedCompactTextClass}>{row.sourceModule}</span>
  },
  {
    key: 'counterpartyName',
    header: 'Contraparte',
    render: (row) => <span className={sharedCompactTextClass}>{row.counterpartyName ?? '—'}</span>
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />
  },
  {
    key: 'totalAmount',
    header: 'Total',
    render: (row) => (
      <span className="text-sm font-medium text-foreground">
        {formatCurrency(row.totalAmount, row.currency)}
      </span>
    )
  },
  {
    key: 'paidAmount',
    header: 'Pago',
    render: (row) => (
      <span className={sharedCompactTextClass}>{formatCurrency(row.paidAmount, row.currency)}</span>
    )
  },
  {
    key: 'outstandingAmount',
    header: 'Pendente',
    render: (row) => (
      <span
        className={
          row.outstandingAmount > 0
            ? 'text-sm font-medium text-warning'
            : sharedCompactTextClass
        }
      >
        {formatCurrency(row.outstandingAmount, row.currency)}
      </span>
    )
  },
  {
    key: 'issuedAt',
    header: 'Emissão',
    render: (row) => <span className={sharedCompactTextClass}>{formatDate(row.issuedAt)}</span>
  },
  {
    key: 'dueAt',
    header: 'Vencimento',
    render: (row) => <span className={sharedCompactTextClass}>{formatDate(row.dueAt)}</span>
  }
];

export function FinanceInvoicesPage() {
  const [pageData, setPageData] = useState<PageResponse<FinanceInvoice>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState('');
  const [sourceModuleFilter, setSourceModuleFilter] = useState('');

  const load = useCallback(
    async (page: number, currentStatus: string, currentSourceModule: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await financeService.listInvoices(page, pageSize, {
          status: currentStatus || undefined,
          sourceModule: currentSourceModule || undefined
        });
        setPageData(data);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar faturas.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(0, statusFilter, sourceModuleFilter);
  }, [load, statusFilter, sourceModuleFilter]);

  useEffect(() => {
    notificationService.getSummary().then((summary) => {
      const overdueItem = summary.items.find((i) => i.key === 'finance-overdue-invoices');
      if (overdueItem) {
        const match = overdueItem.title.match(/^\d+/);
        setOverdueCount(match ? parseInt(match[0], 10) : 0);
      }
    }).catch(() => { /* non-critical */ });
  }, []);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        title="Faturas"
        eyebrow="Finance"
        description="Visão consolidada de todas as faturas geradas pela plataforma."
      />

      {overdueCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              {overdueCount} fatura{overdueCount === 1 ? '' : 's'} em atraso
            </p>
            <p className="mt-0.5 text-xs text-destructive/80">
              Faturas emitidas com vencimento ultrapassado precisam de acompanhamento de pagamento.{' '}
              <Link
                href="?status=ISSUED"
                className="font-semibold underline underline-offset-2"
                onClick={() => setStatusFilter('ISSUED')}
              >
                Ver faturas emitidas
              </Link>
            </p>
          </div>
        </div>
      )}

      <PageSection title="Filtros">
        <div className={`${sharedFilterToolbarClass} sm:grid-cols-2`}>
          <FormSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
          <FormSelect
            label="Módulo de origem"
            value={sourceModuleFilter}
            onChange={setSourceModuleFilter}
            options={sourceModuleOptions}
          />
        </div>
      </PageSection>

      <PageSection
        title="Faturas"
        description={
          loading
            ? 'Carregando…'
            : `${totalItems} fatura${totalItems !== 1 ? 's' : ''} encontrada${totalItems !== 1 ? 's' : ''}`
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
          onPageChange={(p) => void load(p, statusFilter, sourceModuleFilter)}
        />
      </PageSection>
    </div>
  );
}
