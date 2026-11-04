'use client';

import { useCallback, useEffect, useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateTimeForLocale } from '@/shared/i18n/formatters';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { financeService } from '@/shared/services/finance-service';
import { PageResponse } from '@/shared/types/common';
import { FinanceCashMovement } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FilterChip } from '@/shared/ui/filter-chip';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;

type CashCopy = AppMessages['screens']['financeCash'];

const initialPage: PageResponse<FinanceCashMovement> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function buildCategoryLabels(copy: CashCopy): Record<string, string> {
  // Mirrors the backend FinanceCashCategory enum.
  return {
    INVOICE_PAYMENT: copy.categoryInvoicePayment,
    PAYMENT_REVERSAL: copy.categoryPaymentReversal,
    MANUAL_ADJUSTMENT: copy.categoryManualAdjustment
  };
}

function isInbound(direction: string) {
  return direction.toUpperCase() === 'IN';
}

export function FinanceCashPage() {
  const copy = useAppMessages().screens.financeCash;
  const { locale } = useAppI18n();
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
        setError(resolveApiErrorMessage(err, copy.loadError));
      } finally {
        setLoading(false);
      }
    },
    [copy]
  );

  useEffect(() => {
    void load(0, directionFilter, categoryFilter);
  }, [load, directionFilter, categoryFilter]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const categoryLabels = buildCategoryLabels(copy);

  const columns: DataTableColumn<FinanceCashMovement>[] = [
    {
      key: 'occurredAt',
      header: copy.columnDate,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">
          {row.occurredAt ? formatDateTimeForLocale(locale, row.occurredAt) : '-'}
        </span>
      )
    },
    {
      key: 'direction',
      header: copy.direction,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--ink-2)]">
          <span className="ui-status-dot" data-status={isInbound(row.direction) ? 'done' : 'warn'} aria-hidden="true" />
          {isInbound(row.direction) ? copy.directionIn : copy.directionOut}
        </span>
      )
    },
    {
      key: 'category',
      header: copy.category,
      render: (row) => (
        <span className="text-sm text-[var(--ink-2)]">{categoryLabels[row.category?.toUpperCase() ?? ''] ?? row.category ?? '-'}</span>
      )
    },
    {
      key: 'description',
      header: copy.columnDescription,
      render: (row) => (
        <span className="line-clamp-1 max-w-sm text-sm text-[var(--ink)]">{row.description ?? '-'}</span>
      )
    },
    {
      key: 'amount',
      header: copy.columnAmount,
      className: 'text-right',
      render: (row) => (
        <span className={`ui-mono whitespace-nowrap font-medium ${isInbound(row.direction) ? 'text-[var(--ink)]' : 'text-[var(--danger)]'}`}>
          {isInbound(row.direction) ? '+' : '−'}
          {formatCurrencyForLocale(locale, row.amount, row.currency)}
        </span>
      )
    },
    {
      key: 'invoiceId',
      header: copy.columnInvoice,
      render: (row) => (
        <span className="ui-mono text-xs text-[var(--muted)]" title={row.invoiceId ?? undefined}>
          {row.invoiceId ? `${row.invoiceId.slice(0, 8)}…` : '-'}
        </span>
      )
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
          label={copy.direction}
          value={directionFilter}
          onChange={setDirectionFilter}
          options={[
            { value: '', label: copy.allDirections },
            { value: 'IN', label: copy.directionIn },
            { value: 'OUT', label: copy.directionOut }
          ]}
        />
        <FilterChip
          label={copy.category}
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: '', label: copy.allCategories },
            ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))
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
          onPageChange={(page) => void load(page, directionFilter, categoryFilter)}
        />
      </div>
    </div>
  );
}
