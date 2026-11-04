'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { financeService } from '@/shared/services/finance-service';
import { PageResponse } from '@/shared/types/common';
import { FinanceCashMovement, FinanceInvoice, FinancePayment } from '@/shared/types/finance';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { PageTitle } from '@/shared/ui/page-title';

const RECENT_SIZE = 8;

// Each block loads on its own: a user may read pet invoices without access to the finance API.
type Block<T> = {
  status: 'loading' | 'ready' | 'unavailable';
  rows: T[];
  total: number;
};

function loadingBlock<T>(): Block<T> {
  return { status: 'loading', rows: [], total: 0 };
}

function toBlock<T>(result: PromiseSettledResult<PageResponse<T>>): Block<T> {
  if (result.status === 'rejected') {
    return { status: 'unavailable', rows: [], total: 0 };
  }
  return { status: 'ready', rows: resolvePageItems(result.value), total: resolveTotalItems(result.value) };
}

function isInbound(direction: string) {
  return direction.toUpperCase() === 'IN';
}

type RecentSectionProps = {
  id: string;
  title: string;
  href: string;
  viewAllLabel: string;
  children: ReactNode;
};

function RecentSection({ id, title, href, viewAllLabel, children }: RecentSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={id} className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
        <Link href={href} className="text-sm text-[var(--ink-2)] underline-offset-2 hover:text-[var(--ink)] hover:underline">
          {viewAllLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

export function FinanceDashboard() {
  const { locale } = useAppI18n();
  const screens = useAppMessages().screens;
  const copy = screens.petFinanceOverview;
  const paymentsCopy = screens.financePayments;
  const { hasAnyPermission } = usePermissions();

  const canAccessFinance = hasAnyPermission(['finance.read', 'finance.invoice.read', 'finance.cash.read', 'pet.invoice.read']);

  const [openInvoices, setOpenInvoices] = useState<Block<FinanceInvoice>>(loadingBlock);
  const [invoices, setInvoices] = useState<Block<FinanceInvoice>>(loadingBlock);
  const [cash, setCash] = useState<Block<FinanceCashMovement>>(loadingBlock);
  const [payments, setPayments] = useState<Block<FinancePayment>>(loadingBlock);

  useEffect(() => {
    if (!canAccessFinance) {
      return;
    }

    let active = true;
    Promise.allSettled([
      financeService.listInvoices(0, 1, { status: 'ISSUED' }),
      financeService.listInvoices(0, RECENT_SIZE),
      financeService.listCashMovements(0, RECENT_SIZE),
      financeService.listPayments(0, RECENT_SIZE)
    ]).then(([openResult, invoicesResult, cashResult, paymentsResult]) => {
      if (!active) {
        return;
      }
      setOpenInvoices(toBlock(openResult));
      setInvoices(toBlock(invoicesResult));
      setCash(toBlock(cashResult));
      setPayments(toBlock(paymentsResult));
    });

    return () => {
      active = false;
    };
  }, [canAccessFinance]);

  const methodLabels: Record<string, string> = {
    PIX: 'PIX',
    CASH: paymentsCopy.methodCash,
    CREDIT_CARD: paymentsCopy.methodCreditCard,
    DEBIT_CARD: paymentsCopy.methodDebitCard,
    BANK_TRANSFER: paymentsCopy.methodBankTransfer,
    BOLETO: paymentsCopy.methodBoleto,
    MANUAL: paymentsCopy.methodManual,
    OTHER: paymentsCopy.methodOther
  };

  const formatMoney = (value: number, currency?: string) => formatCurrencyForLocale(locale, value, currency);
  const formatWhen = (value?: string | null) => (value ? formatDateTimeForLocale(locale, value) : '-');

  const invoiceColumns: DataTableColumn<FinanceInvoice>[] = [
    {
      key: 'counterparty',
      header: copy.columnCounterparty,
      render: (row) => <span className="font-medium text-[var(--ink)]">{row.counterpartyName ?? '-'}</span>
    },
    { key: 'status', header: copy.columnStatus, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'amount',
      header: copy.columnAmount,
      className: 'text-right',
      render: (row) => (
        <div className="whitespace-nowrap">
          <p className="ui-mono text-[var(--ink)]">{formatMoney(row.totalAmount, row.currency)}</p>
          {row.outstandingAmount > 0 ? (
            <p className="ui-mono text-xs text-[var(--warn)]">{copy.openAmount} {formatMoney(row.outstandingAmount, row.currency)}</p>
          ) : null}
        </div>
      )
    }
  ];

  const cashColumns: DataTableColumn<FinanceCashMovement>[] = [
    {
      key: 'occurredAt',
      header: copy.columnDate,
      render: (row) => <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{formatWhen(row.occurredAt)}</span>
    },
    {
      key: 'description',
      header: copy.columnDescription,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--ink)]">
          <span className="ui-status-dot" data-status={isInbound(row.direction) ? 'done' : 'warn'} aria-hidden="true" />
          <span className="line-clamp-1">{row.description ?? (isInbound(row.direction) ? copy.inbound : copy.outbound)}</span>
        </span>
      )
    },
    {
      key: 'amount',
      header: copy.columnAmount,
      className: 'text-right',
      render: (row) => (
        <span className={`ui-mono whitespace-nowrap ${isInbound(row.direction) ? 'text-[var(--ink)]' : 'text-[var(--danger)]'}`}>
          {isInbound(row.direction) ? '+' : '−'}{formatMoney(row.amount, row.currency)}
        </span>
      )
    }
  ];

  const paymentColumns: DataTableColumn<FinancePayment>[] = [
    {
      key: 'receivedAt',
      header: copy.columnDate,
      render: (row) => <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{formatWhen(row.receivedAt)}</span>
    },
    {
      key: 'method',
      header: copy.columnMethod,
      render: (row) => <span className="text-sm text-[var(--ink-2)]">{methodLabels[row.method] ?? row.method}</span>
    },
    {
      key: 'amount',
      header: copy.columnAmount,
      className: 'text-right',
      render: (row) => <span className="ui-mono whitespace-nowrap text-[var(--ink)]">{formatMoney(row.amount, row.currency)}</span>
    }
  ];

  function renderBlock<T>(block: Block<T>, columns: DataTableColumn<T>[], getRowKey: (row: T) => string) {
    if (block.status === 'unavailable') {
      return <p className="text-sm text-[var(--muted)]">{copy.sectionUnavailable}</p>;
    }
    return (
      <DataTable
        columns={columns}
        rows={block.rows}
        getRowKey={getRowKey}
        loading={block.status === 'loading'}
        emptyState={{ title: copy.emptySection, description: '' }}
      />
    );
  }

  const metrics = [
    { label: copy.metricOpenInvoices, block: openInvoices, tone: openInvoices.total > 0 ? 'text-[var(--warn)]' : undefined },
    { label: copy.metricCashMovements, block: cash, tone: undefined },
    { label: copy.metricPayments, block: payments, tone: undefined }
  ];

  if (!canAccessFinance) {
    return (
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />
        <PageTitle title={copy.title} description={copy.description} />
        <div className="ui-notice-warning">{copy.noPermission}</div>
      </div>
    );
  }

  return (
    <div className={sharedPageStackClass}>
      <PetModuleSubnav />

      <PageTitle
        title={copy.title}
        description={copy.description}
        actions={(
          <Link href="/pet/invoices" className="ui-secondary-button">
            {copy.openBilling}
          </Link>
        )}
      />

      <dl className="grid gap-4 border-y border-[color:var(--line)] py-3 sm:grid-cols-3">
        {metrics.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-[var(--muted)]">{item.label}</dt>
            <dd className={`ui-mono mt-0.5 text-lg font-semibold ${item.tone ?? 'text-[var(--ink)]'}`}>
              {item.block.status === 'ready' ? new Intl.NumberFormat(locale).format(item.block.total) : '-'}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentSection id="finance-recent-invoices" title={copy.recentInvoices} href="/finance/invoices" viewAllLabel={copy.viewAll}>
          {renderBlock(invoices, invoiceColumns, (row) => row.id)}
        </RecentSection>
        <RecentSection id="finance-recent-payments" title={copy.recentPayments} href="/finance/payments" viewAllLabel={copy.viewAll}>
          {renderBlock(payments, paymentColumns, (row) => row.id)}
        </RecentSection>
      </div>

      <RecentSection id="finance-recent-cash" title={copy.recentCash} href="/finance/cash" viewAllLabel={copy.viewAll}>
        {renderBlock(cash, cashColumns, (row) => row.id)}
      </RecentSection>
    </div>
  );
}
