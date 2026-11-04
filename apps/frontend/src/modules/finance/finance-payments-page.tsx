'use client';

import { useCallback, useEffect, useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateTimeForLocale } from '@/shared/i18n/formatters';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { financeService } from '@/shared/services/finance-service';
import { PageResponse } from '@/shared/types/common';
import { FinancePayment } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FilterChip } from '@/shared/ui/filter-chip';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;

type PaymentsCopy = AppMessages['screens']['financePayments'];

const initialPage: PageResponse<FinancePayment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function buildMethodLabels(copy: PaymentsCopy): Record<string, string> {
  return {
    PIX: 'PIX',
    CASH: copy.methodCash,
    CREDIT_CARD: copy.methodCreditCard,
    DEBIT_CARD: copy.methodDebitCard,
    BANK_TRANSFER: copy.methodBankTransfer,
    BOLETO: copy.methodBoleto,
    MANUAL: copy.methodManual,
    OTHER: copy.methodOther
  };
}

export function FinancePaymentsPage() {
  const copy = useAppMessages().screens.financePayments;
  const { locale } = useAppI18n();
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
        setError(resolveApiErrorMessage(err, copy.loadError));
      } finally {
        setLoading(false);
      }
    },
    [copy]
  );

  useEffect(() => {
    void load(0, statusFilter, methodFilter);
  }, [load, statusFilter, methodFilter]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const methodLabels = buildMethodLabels(copy);

  const columns: DataTableColumn<FinancePayment>[] = [
    {
      key: 'receivedAt',
      header: copy.columnPaidAt,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">
          {row.receivedAt ? formatDateTimeForLocale(locale, row.receivedAt) : '-'}
        </span>
      )
    },
    {
      key: 'status',
      header: copy.status,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'method',
      header: copy.method,
      render: (row) => <span className="text-sm text-[var(--ink-2)]">{methodLabels[row.method] ?? row.method}</span>
    },
    {
      key: 'amount',
      header: copy.columnAmount,
      className: 'text-right',
      render: (row) => (
        <span className="ui-mono whitespace-nowrap font-medium text-[var(--ink)]">
          {formatCurrencyForLocale(locale, row.amount, row.currency)}
        </span>
      )
    },
    {
      key: 'invoiceId',
      header: copy.columnInvoice,
      render: (row) => (
        <span className="ui-mono text-xs text-[var(--muted)]" title={row.invoiceId}>
          {row.invoiceId.slice(0, 8)}…
        </span>
      )
    },
    {
      key: 'referenceCode',
      header: copy.columnReference,
      render: (row) => <span className="ui-mono text-xs text-[var(--muted)]">{row.referenceCode ?? '-'}</span>
    }
  ];

  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        title={copy.title}
        count={loading ? undefined : totalItems}
        description={copy.description}
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={copy.status}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: copy.allStatuses },
            { value: 'PENDING', label: copy.statusPending },
            { value: 'CONFIRMED', label: copy.statusConfirmed },
            { value: 'CANCELED', label: copy.statusCanceled }
          ]}
        />
        <FilterChip
          label={copy.method}
          value={methodFilter}
          onChange={setMethodFilter}
          options={[
            { value: '', label: copy.allMethods },
            ...Object.entries(methodLabels).map(([value, label]) => ({ value, label }))
          ]}
        />
      </div>

      {error ? <div className="ui-notice-error">{error}</div> : null}

      <div className="space-y-2">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(row) => row.id}
          loadingTitle={copy.loadingTitle}
          emptyState={{ title: copy.emptyTitle, description: copy.emptyDescription }}
        />
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => void load(page, statusFilter, methodFilter)}
        />
      </div>
    </div>
  );
}
