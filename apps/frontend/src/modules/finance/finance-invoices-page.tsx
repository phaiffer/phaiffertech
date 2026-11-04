'use client';

import { useCallback, useEffect, useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { financeService } from '@/shared/services/finance-service';
import { notificationService } from '@/shared/services/notification-service';
import { PageResponse } from '@/shared/types/common';
import { FinanceInvoice } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FilterChip } from '@/shared/ui/filter-chip';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;
const OVERDUE_NOTIFICATION_KEY = 'finance-overdue-invoices';

const initialPage: PageResponse<FinanceInvoice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

// The notification summary carries the overdue total as the leading number of its title.
function parseLeadingCount(title: string) {
  const match = title.match(/^\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function FinanceInvoicesPage() {
  const copy = useAppMessages().screens.financeInvoices;
  const { locale } = useAppI18n();
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
        setError(resolveApiErrorMessage(err, copy.loadError));
      } finally {
        setLoading(false);
      }
    },
    [copy]
  );

  useEffect(() => {
    void load(0, statusFilter, sourceModuleFilter);
  }, [load, statusFilter, sourceModuleFilter]);

  useEffect(() => {
    notificationService.getSummary().then((summary) => {
      const overdueItem = summary.items.find((item) => item.key === OVERDUE_NOTIFICATION_KEY);
      setOverdueCount(overdueItem ? parseLeadingCount(overdueItem.title) : 0);
    }).catch(() => {
      // Non-critical: the overdue notice is only a shortcut to the issued filter.
    });
  }, []);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const sourceLabels: Record<string, string> = {
    PET: copy.sourcePet,
    CRM: copy.sourceCrm,
    MANUAL: copy.sourceManual
  };

  const columns: DataTableColumn<FinanceInvoice>[] = [
    {
      key: 'counterpartyName',
      header: copy.columnCounterparty,
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{row.counterpartyName ?? '-'}</p>
          <p className="ui-mono text-xs text-[var(--muted)]" title={row.id}>
            {sourceLabels[row.sourceModule] ?? row.sourceModule} · {row.id.slice(0, 8)}…
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: copy.status,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'totalAmount',
      header: copy.columnTotal,
      className: 'text-right',
      render: (row) => (
        <span className="ui-mono whitespace-nowrap font-medium text-[var(--ink)]">
          {formatCurrencyForLocale(locale, row.totalAmount, row.currency)}
        </span>
      )
    },
    {
      key: 'outstandingAmount',
      header: copy.columnOpen,
      className: 'text-right',
      render: (row) => (
        <span className={`ui-mono whitespace-nowrap ${row.outstandingAmount > 0 ? 'text-[var(--warn)]' : 'text-[var(--muted)]'}`}>
          {formatCurrencyForLocale(locale, row.outstandingAmount, row.currency)}
        </span>
      )
    },
    {
      key: 'issuedAt',
      header: copy.columnIssued,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{row.issuedAt ? formatDateForLocale(locale, row.issuedAt) : '-'}</span>
      )
    },
    {
      key: 'dueAt',
      header: copy.columnDue,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{row.dueAt ? formatDateForLocale(locale, row.dueAt) : '-'}</span>
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

      {overdueCount > 0 ? (
        <div className="ui-notice-warning flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">{copy.overdueTitle.replace('{count}', String(overdueCount))}</p>
            <p className="text-xs">{copy.overdueDescription}</p>
          </div>
          {statusFilter !== 'ISSUED' ? (
            <button type="button" onClick={() => setStatusFilter('ISSUED')} className="ui-secondary-button">
              {copy.overdueAction}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={copy.status}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: copy.allStatuses },
            { value: 'DRAFT', label: copy.statusDraft },
            { value: 'ISSUED', label: copy.statusIssued },
            { value: 'PAID', label: copy.statusPaid },
            { value: 'CANCELED', label: copy.statusCanceled }
          ]}
        />
        <FilterChip
          label={copy.source}
          value={sourceModuleFilter}
          onChange={setSourceModuleFilter}
          options={[
            { value: '', label: copy.allSources },
            ...Object.entries(sourceLabels).map(([value, label]) => ({ value, label }))
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
          onPageChange={(page) => void load(page, statusFilter, sourceModuleFilter)}
        />
      </div>
    </div>
  );
}
