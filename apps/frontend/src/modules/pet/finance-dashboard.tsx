'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Download,
  Filter,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages, type AppLocale } from '@/shared/i18n/app-i18n-provider';
import { cn } from '@/shared/lib/cn';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Button } from '@/shared/ui/shadcn/button';

type CashMovementDirection = 'INBOUND' | 'OUTBOUND';
type FinancePeriodFilter = 'today' | 'week' | 'month' | 'lastMonth';

type CashMovement = {
  id: string;
  direction: CashMovementDirection;
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
};

type FinanceInvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELED';

type FinanceInvoice = {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: FinanceInvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAmount?: number;
};

type FinancePayment = {
  id: string;
  invoiceNumber?: string;
  clientName: string;
  amount: number;
  method: string;
  paidAt: string;
};

type FinanceMovementDraft = {
  direction: CashMovementDirection;
  category: string;
  amount: string;
  description: string;
};

type FinanceSnapshotCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
};

const now = Date.now();

const initialMovements: CashMovement[] = [
  {
    id: 'movement-1',
    direction: 'INBOUND',
    category: 'sale',
    amount: 150,
    description: 'Venda de racao premium',
    createdAt: new Date(now - 30 * 60_000).toISOString(),
    createdBy: { id: '1', name: 'Maria Silva' }
  },
  {
    id: 'movement-2',
    direction: 'INBOUND',
    category: 'service',
    amount: 85,
    description: 'Banho e tosa - Rex',
    createdAt: new Date(now - 2 * 60 * 60_000).toISOString(),
    createdBy: { id: '2', name: 'Joao Santos' }
  },
  {
    id: 'movement-3',
    direction: 'OUTBOUND',
    category: 'expense',
    amount: 320,
    description: 'Compra de shampoo profissional',
    createdAt: new Date(now - 5 * 60 * 60_000).toISOString(),
    createdBy: { id: '1', name: 'Maria Silva' }
  },
  {
    id: 'movement-4',
    direction: 'INBOUND',
    category: 'service',
    amount: 120,
    description: 'Consulta veterinaria - Luna',
    createdAt: new Date(now - 26 * 60 * 60_000).toISOString(),
    createdBy: { id: '3', name: 'Dr. Carlos' }
  },
  {
    id: 'movement-5',
    direction: 'OUTBOUND',
    category: 'withdrawal',
    amount: 500,
    description: 'Retirada para pagamento de fornecedor',
    createdAt: new Date(now - 8 * 24 * 60 * 60_000).toISOString(),
    createdBy: { id: '1', name: 'Maria Silva' }
  }
];

const initialInvoices: FinanceInvoice[] = [
  {
    id: 'invoice-1',
    number: 'INV-2026-001',
    clientName: 'Ana Costa',
    amount: 450,
    status: 'PAID',
    issuedAt: new Date(now - 2 * 24 * 60 * 60_000).toISOString(),
    dueAt: new Date(now + 5 * 24 * 60 * 60_000).toISOString(),
    paidAmount: 450
  },
  {
    id: 'invoice-2',
    number: 'INV-2026-002',
    clientName: 'Pedro Oliveira',
    amount: 280,
    status: 'ISSUED',
    issuedAt: new Date(now - 24 * 60 * 60_000).toISOString(),
    dueAt: new Date(now + 10 * 24 * 60 * 60_000).toISOString()
  },
  {
    id: 'invoice-3',
    number: 'INV-2026-003',
    clientName: 'Julia Mendes',
    amount: 620,
    status: 'OVERDUE',
    issuedAt: new Date(now - 15 * 24 * 60 * 60_000).toISOString(),
    dueAt: new Date(now - 5 * 24 * 60 * 60_000).toISOString()
  },
  {
    id: 'invoice-4',
    number: 'INV-2026-004',
    clientName: 'Roberto Lima',
    amount: 180,
    status: 'PARTIALLY_PAID',
    issuedAt: new Date(now - 3 * 24 * 60 * 60_000).toISOString(),
    dueAt: new Date(now + 7 * 24 * 60 * 60_000).toISOString(),
    paidAmount: 100
  }
];

const initialPayments: FinancePayment[] = [
  {
    id: 'payment-1',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Ana Costa',
    amount: 450,
    method: 'pix',
    paidAt: new Date(now - 90 * 60_000).toISOString()
  },
  {
    id: 'payment-2',
    clientName: 'Marcos Souza',
    amount: 85,
    method: 'credit',
    paidAt: new Date(now - 4 * 60 * 60_000).toISOString()
  },
  {
    id: 'payment-3',
    clientName: 'Carla Dias',
    amount: 120,
    method: 'debit',
    paidAt: new Date(now - 30 * 60 * 60_000).toISOString()
  }
];

const emptyMovementDraft: FinanceMovementDraft = {
  direction: 'INBOUND',
  category: 'sale',
  amount: '',
  description: ''
};

const movementCategoryIcons: Record<string, LucideIcon> = {
  sale: Receipt,
  service: CalendarClock,
  refund: ArrowDownLeft,
  expense: TrendingDown,
  withdrawal: ArrowUpRight,
  deposit: ArrowDownLeft,
  adjustment: Wallet,
  other: Banknote
};

const invoiceStatusToneClass: Record<FinanceInvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELED: 'bg-slate-100 text-slate-500'
};

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isInCurrentWeek(value: Date, reference: Date) {
  const currentDay = reference.getDay();
  const sundayOffset = -currentDay;
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(reference.getDate() + sundayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return value >= start && value < end;
}

function isInCurrentMonth(value: Date, reference: Date) {
  return value.getFullYear() === reference.getFullYear() && value.getMonth() === reference.getMonth();
}

function isInLastMonth(value: Date, reference: Date) {
  const lastMonth = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return value.getFullYear() === lastMonth.getFullYear() && value.getMonth() === lastMonth.getMonth();
}

function matchesPeriod(isoDate: string, period: FinancePeriodFilter, reference: Date) {
  const value = new Date(isoDate);
  if (period === 'today') {
    return isSameDay(value, reference);
  }

  if (period === 'week') {
    return isInCurrentWeek(value, reference);
  }

  if (period === 'month') {
    return isInCurrentMonth(value, reference);
  }

  return isInLastMonth(value, reference);
}

function formatCurrency(value: number, locale: AppLocale, currency = 'BRL') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDateTime(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatTime(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function resolveInvoiceOutstandingAmount(invoice: FinanceInvoice) {
  return Math.max(invoice.amount - (invoice.paidAmount ?? 0), 0);
}

function downloadJson(filename: string, payload: unknown) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function FinanceSnapshotCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default'
}: FinanceSnapshotCardProps) {
  const toneClass = tone === 'positive'
    ? 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.98))]'
    : tone === 'negative'
      ? 'border-red-200/80 bg-[linear-gradient(180deg,rgba(239,68,68,0.08),rgba(255,255,255,0.98))]'
      : tone === 'warning'
        ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.98))]'
        : 'border-slate-200/90 bg-white';
  const iconClass = tone === 'positive'
    ? 'bg-emerald-100 text-emerald-700'
    : tone === 'negative'
      ? 'bg-red-100 text-red-700'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]';

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 ${sharedCompactTextClass}`}>{detail}</p>
    </div>
  );
}

function buildInvoiceStatusLabel(
  status: FinanceInvoiceStatus,
  labels: ReturnType<typeof useAppMessages>['petFinance']['invoices']['status']
) {
  switch (status) {
    case 'DRAFT':
      return labels.draft;
    case 'ISSUED':
      return labels.issued;
    case 'PAID':
      return labels.paid;
    case 'PARTIALLY_PAID':
      return labels.partiallyPaid;
    case 'OVERDUE':
      return labels.overdue;
    case 'CANCELED':
      return labels.canceled;
  }
}

function buildPaymentMethodLabel(
  method: string,
  labels: ReturnType<typeof useAppMessages>['petFinance']['payments']['methods']
) {
  if (method === 'cash') {
    return labels.cash;
  }

  if (method === 'credit') {
    return labels.credit;
  }

  if (method === 'debit') {
    return labels.debit;
  }

  if (method === 'pix') {
    return labels.pix;
  }

  if (method === 'transfer') {
    return labels.transfer;
  }

  if (method === 'check') {
    return labels.check;
  }

  return labels.other;
}

function buildTableSectionTitle(locale: AppLocale, portugueseLabel: string, englishLabel: string) {
  return locale === 'pt-BR' ? portugueseLabel : englishLabel;
}

export function FinanceDashboard() {
  const { locale } = useAppI18n();
  const messages = useAppMessages();
  const t = messages.petFinance;
  const { hasAnyPermission } = usePermissions();

  const canAccessFinance = hasAnyPermission([
    'finance.read',
    'finance.invoice.read',
    'finance.cash.read',
    'pet.invoice.read'
  ]);

  const [movements, setMovements] = useState<CashMovement[]>(initialMovements);
  const [invoices] = useState<FinanceInvoice[]>(initialInvoices);
  const [payments] = useState<FinancePayment[]>(initialPayments);
  const [periodFilter, setPeriodFilter] = useState<FinancePeriodFilter>('today');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [draftMovement, setDraftMovement] = useState<FinanceMovementDraft>(emptyMovementDraft);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredMovements = useMemo(() => {
    const reference = new Date();

    return movements.filter((movement) => {
      if (!matchesPeriod(movement.createdAt, periodFilter, reference)) {
        return false;
      }

      if (directionFilter !== 'all' && movement.direction !== directionFilter) {
        return false;
      }

      if (categoryFilter !== 'all' && movement.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, directionFilter, movements, periodFilter]);

  const todayMovements = useMemo(() => {
    const reference = new Date();
    return movements.filter((movement) => isSameDay(new Date(movement.createdAt), reference));
  }, [movements]);

  const currentMonthPayments = useMemo(() => {
    const reference = new Date();
    return payments.filter((payment) => isInCurrentMonth(new Date(payment.paidAt), reference));
  }, [payments]);

  const openInvoices = useMemo(
    () => invoices.filter((invoice) => !['PAID', 'CANCELED'].includes(invoice.status) && resolveInvoiceOutstandingAmount(invoice) > 0),
    [invoices]
  );

  const overdueInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'OVERDUE'),
    [invoices]
  );

  const todayIncome = useMemo(
    () => todayMovements
      .filter((movement) => movement.direction === 'INBOUND')
      .reduce((total, movement) => total + movement.amount, 0),
    [todayMovements]
  );

  const todayExpenses = useMemo(
    () => todayMovements
      .filter((movement) => movement.direction === 'OUTBOUND')
      .reduce((total, movement) => total + movement.amount, 0),
    [todayMovements]
  );

  const pendingPayments = useMemo(
    () => openInvoices.reduce((total, invoice) => total + resolveInvoiceOutstandingAmount(invoice), 0),
    [openInvoices]
  );

  const monthRevenue = useMemo(
    () => currentMonthPayments.reduce((total, payment) => total + payment.amount, 0),
    [currentMonthPayments]
  );

  const movementColumns: DataTableColumn<CashMovement>[] = [
    {
      key: 'direction',
      header: t.filters.direction,
      className: 'whitespace-nowrap',
      render: (movement) => {
        const inbound = movement.direction === 'INBOUND';
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              inbound ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            )}
          >
            {inbound ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {inbound ? t.cashMovements.inbound : t.cashMovements.outbound}
          </span>
        );
      }
    },
    {
      key: 'category',
      header: t.filters.category,
      render: (movement) => {
        const Icon = movementCategoryIcons[movement.category] ?? Banknote;
        const label = t.cashMovements.categories[movement.category as keyof typeof t.cashMovements.categories] ?? movement.category;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-500" />
            <span>{label}</span>
          </div>
        );
      }
    },
    {
      key: 'description',
      header: t.form.description,
      render: (movement) => (
        <div>
          <p className="font-medium text-slate-900">{movement.description}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {movement.createdBy ? movement.createdBy.name : buildTableSectionTitle(locale, 'Lancamento manual', 'Manual entry')}
          </p>
        </div>
      )
    },
    {
      key: 'amount',
      header: t.form.amount,
      className: 'whitespace-nowrap',
      render: (movement) => (
        <span
          className={cn(
            'font-semibold tabular-nums',
            movement.direction === 'INBOUND' ? 'text-emerald-700' : 'text-red-700'
          )}
        >
          {movement.direction === 'INBOUND' ? '+' : '-'}
          {formatCurrency(movement.amount, locale)}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: t.form.date,
      className: 'whitespace-nowrap',
      render: (movement) => (
        <div>
          <p className="font-medium text-slate-900">{formatTime(movement.createdAt, locale)}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{formatDateTime(movement.createdAt, locale)}</p>
        </div>
      )
    }
  ];

  const invoiceColumns: DataTableColumn<FinanceInvoice>[] = [
    {
      key: 'invoice',
      header: buildTableSectionTitle(locale, 'Fatura', 'Invoice'),
      render: (invoice) => (
        <div>
          <p className="font-medium text-slate-900">{invoice.number}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{invoice.clientName}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: buildTableSectionTitle(locale, 'Status', 'Status'),
      className: 'whitespace-nowrap',
      render: (invoice) => (
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
            invoiceStatusToneClass[invoice.status]
          )}
        >
          {buildInvoiceStatusLabel(invoice.status, t.invoices.status)}
        </span>
      )
    },
    {
      key: 'amount',
      header: t.form.amount,
      className: 'whitespace-nowrap',
      render: (invoice) => (
        <div>
          <p className="font-semibold text-slate-900">{formatCurrency(invoice.amount, locale)}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {buildTableSectionTitle(locale, 'Saldo em aberto', 'Open balance')}: {formatCurrency(resolveInvoiceOutstandingAmount(invoice), locale)}
          </p>
        </div>
      )
    }
  ];

  const paymentMethodHeader = buildTableSectionTitle(locale, 'Metodo', 'Method');
  const clientHeader = buildTableSectionTitle(locale, 'Cliente', 'Client');

  const paymentColumns: DataTableColumn<FinancePayment>[] = [
    {
      key: 'client',
      header: clientHeader,
      render: (payment) => (
        <div>
          <p className="font-medium text-slate-900">{payment.clientName}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {payment.invoiceNumber ?? buildTableSectionTitle(locale, 'Sem fatura vinculada', 'No linked invoice')}
          </p>
        </div>
      )
    },
    {
      key: 'method',
      header: paymentMethodHeader,
      className: 'whitespace-nowrap',
      render: (payment) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-slate-500" />
          <span>{buildPaymentMethodLabel(payment.method, t.payments.methods)}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: t.form.amount,
      className: 'whitespace-nowrap',
      render: (payment) => (
        <div>
          <p className="font-semibold text-emerald-700">+{formatCurrency(payment.amount, locale)}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{formatDateTime(payment.paidAt, locale)}</p>
        </div>
      )
    }
  ];

  const categoryOptions = [
    { value: 'all', label: t.filters.allCategories },
    { value: 'sale', label: t.cashMovements.categories.sale },
    { value: 'service', label: t.cashMovements.categories.service },
    { value: 'expense', label: t.cashMovements.categories.expense },
    { value: 'withdrawal', label: t.cashMovements.categories.withdrawal },
    { value: 'deposit', label: t.cashMovements.categories.deposit },
    { value: 'other', label: t.cashMovements.categories.other }
  ];

  const snapshotCards: Array<FinanceSnapshotCardProps & { key: string }> = [
    {
      key: 'balance',
      icon: Wallet,
      label: t.stats.todayBalance,
      value: formatCurrency(todayIncome - todayExpenses, locale),
      detail: `${formatCurrency(todayIncome, locale)} ${buildTableSectionTitle(locale, 'em entradas e', 'in income and')} ${formatCurrency(todayExpenses, locale)} ${buildTableSectionTitle(locale, 'em saidas hoje.', 'in expenses today.')}`,
      tone: todayIncome >= todayExpenses ? 'positive' : 'negative'
    },
    {
      key: 'income',
      icon: TrendingUp,
      label: t.stats.todayIncome,
      value: formatCurrency(todayIncome, locale),
      detail: buildTableSectionTitle(locale, 'Entradas registradas no caixa desde 00:00.', 'Cash entries recorded since 12:00 AM.'),
      tone: 'positive'
    },
    {
      key: 'expenses',
      icon: TrendingDown,
      label: t.stats.todayExpenses,
      value: formatCurrency(todayExpenses, locale),
      detail: buildTableSectionTitle(locale, 'Saidas operacionais e retiradas do dia.', 'Operating expenses and withdrawals for today.'),
      tone: 'negative'
    },
    {
      key: 'pending',
      icon: Receipt,
      label: t.stats.pendingPayments,
      value: formatCurrency(pendingPayments, locale),
      detail: `${openInvoices.length} ${t.stats.openInvoices.toLowerCase()}`,
      tone: overdueInvoices.length > 0 ? 'warning' : 'default'
    },
    {
      key: 'revenue',
      icon: Banknote,
      label: t.stats.monthRevenue,
      value: formatCurrency(monthRevenue, locale),
      detail: buildTableSectionTitle(locale, 'Recebimentos confirmados no mes atual.', 'Payments confirmed in the current month.'),
      tone: 'default'
    },
    {
      key: 'invoices',
      icon: CalendarClock,
      label: t.stats.openInvoices,
      value: String(openInvoices.length),
      detail: overdueInvoices.length > 0
        ? `${overdueInvoices.length} ${buildTableSectionTitle(locale, 'faturas vencidas exigem acao.', 'overdue invoices need attention.')}`
        : buildTableSectionTitle(locale, 'Nenhuma fatura vencida no momento.', 'No overdue invoices right now.'),
      tone: overdueInvoices.length > 0 ? 'warning' : 'default'
    }
  ];

  function resetComposer() {
    setDraftMovement(emptyMovementDraft);
    setShowComposer(false);
  }

  function handleCreateMovement() {
    const amount = Number(draftMovement.amount);

    if (Number.isNaN(amount) || amount <= 0 || !draftMovement.description.trim()) {
      setError(buildTableSectionTitle(
        locale,
        'Preencha descricao e um valor valido para registrar a movimentacao.',
        'Add a description and a valid amount before saving the movement.'
      ));
      setSuccess(null);
      return;
    }

    const nextMovement: CashMovement = {
      id: `movement-${Date.now()}`,
      direction: draftMovement.direction,
      category: draftMovement.category,
      amount,
      description: draftMovement.description.trim(),
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'current-user',
        name: buildTableSectionTitle(locale, 'Lancamento manual', 'Manual entry')
      }
    };

    setMovements((current) => [nextMovement, ...current]);
    setError(null);
    setSuccess(buildTableSectionTitle(
      locale,
      'Movimentacao registrada e ja refletida nos indicadores desta pagina.',
      'Movement recorded and already reflected in the indicators on this page.'
    ));
    resetComposer();
  }

  function handleExport() {
    downloadJson('pet-finance-dashboard.json', {
      exportedAt: new Date().toISOString(),
      filters: {
        period: periodFilter,
        direction: directionFilter,
        category: categoryFilter
      },
      summary: {
        todayIncome,
        todayExpenses,
        todayBalance: todayIncome - todayExpenses,
        pendingPayments,
        monthRevenue,
        openInvoices: openInvoices.length
      },
      movements: filteredMovements,
      invoices,
      payments
    });

    setError(null);
    setSuccess(buildTableSectionTitle(
      locale,
      'Exportacao pronta. O arquivo JSON foi baixado com o recorte atual do dashboard.',
      'Export ready. The JSON file was downloaded with the current dashboard slice.'
    ));
  }

  if (!canAccessFinance) {
    return (
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />
        <PageTitle eyebrow={t.eyebrow} title={t.title} description={t.noPermission} />
      </div>
    );
  }

  return (
    <div className={sharedPageStackClass}>
      <PetModuleSubnav />

      <PageTitle
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={(
          <>
            <Button type="button" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              {t.actions.exportData}
            </Button>
            <Button type="button" onClick={() => setShowComposer((current) => !current)}>
              <Plus className="h-4 w-4" />
              {t.actions.newMovement}
            </Button>
          </>
        )}
      />

      {error ? <div className="ui-notice-warning">{error}</div> : null}
      {success ? <div className="ui-notice-success">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshotCards.map((card) => (
          <FinanceSnapshotCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            detail={card.detail}
            tone={card.tone}
          />
        ))}
      </div>

      <PageSection title={t.filters.title} description={buildTableSectionTitle(locale, 'Ajuste o recorte para revisar o caixa do periodo atual.', 'Adjust the slice to review cash activity for the current period.')}>
        <div className={sharedFilterToolbarClass}>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Filter className="h-4 w-4" />
            <span>{t.filters.title}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FormSelect
              label={t.filters.period}
              value={periodFilter}
              onChange={(value) => setPeriodFilter(value as FinancePeriodFilter)}
              options={[
                { value: 'today', label: t.filters.today },
                { value: 'week', label: t.filters.thisWeek },
                { value: 'month', label: t.filters.thisMonth },
                { value: 'lastMonth', label: t.filters.lastMonth }
              ]}
            />
            <FormSelect
              label={t.filters.direction}
              value={directionFilter}
              onChange={setDirectionFilter}
              options={[
                { value: 'all', label: t.filters.allDirections },
                { value: 'INBOUND', label: t.cashMovements.inbound },
                { value: 'OUTBOUND', label: t.cashMovements.outbound }
              ]}
            />
            <FormSelect
              label={t.filters.category}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
            />
          </div>
        </div>
      </PageSection>

      {showComposer ? (
        <PageSection
          title={t.actions.newMovement}
          description={buildTableSectionTitle(locale, 'Registre uma entrada ou saida e acompanhe o reflexo imediato no resumo financeiro.', 'Register an inbound or outbound movement and see the summary update immediately.')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect
              label={t.form.direction}
              value={draftMovement.direction}
              onChange={(value) => setDraftMovement((current) => ({ ...current, direction: value as CashMovementDirection }))}
              options={[
                { value: 'INBOUND', label: t.cashMovements.inbound },
                { value: 'OUTBOUND', label: t.cashMovements.outbound }
              ]}
            />
            <FormSelect
              label={t.form.category}
              value={draftMovement.category}
              onChange={(value) => setDraftMovement((current) => ({ ...current, category: value }))}
              options={categoryOptions.filter((option) => option.value !== 'all')}
            />
            <FormInput
              label={t.form.amount}
              type="number"
              value={draftMovement.amount}
              onChange={(value) => setDraftMovement((current) => ({ ...current, amount: value }))}
              placeholder="0.00"
            />
            <div className="md:col-span-2">
              <FormTextarea
                label={t.form.description}
                value={draftMovement.description}
                onChange={(value) => setDraftMovement((current) => ({ ...current, description: value }))}
                placeholder={t.form.descriptionPlaceholder}
              />
            </div>
          </div>
          <div className={sharedFormActionsClass}>
            <Button type="button" onClick={handleCreateMovement}>
              {t.form.save}
            </Button>
            <Button type="button" variant="outline" onClick={resetComposer}>
              {t.form.cancel}
            </Button>
          </div>
        </PageSection>
      ) : null}

      <PageSection
        title={t.cashMovements.title}
        description={t.cashMovements.description}
        actions={(
          <div className={`text-sm ${sharedCompactTextClass}`}>
            {filteredMovements.length} {buildTableSectionTitle(locale, 'movimentacoes visiveis', 'visible movements')}
          </div>
        )}
      >
        <DataTable
          columns={movementColumns}
          rows={filteredMovements}
          getRowKey={(movement) => movement.id}
          emptyState={{
            title: t.cashMovements.empty,
            description: t.cashMovements.emptyDescription,
            action: (
              <Button type="button" variant="outline" onClick={() => setShowComposer(true)}>
                <Plus className="h-4 w-4" />
                {t.actions.newMovement}
              </Button>
            )
          }}
        />
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title={t.invoices.title} description={t.invoices.description}>
          <DataTable
            columns={invoiceColumns}
            rows={invoices}
            getRowKey={(invoice) => invoice.id}
            emptyState={{
              title: t.invoices.empty,
              description: buildTableSectionTitle(locale, 'Nenhuma fatura recente para exibir neste momento.', 'No recent invoices to display right now.')
            }}
          />
        </PageSection>

        <PageSection title={t.payments.title} description={t.payments.description}>
          <DataTable
            columns={paymentColumns}
            rows={payments}
            getRowKey={(payment) => payment.id}
            emptyState={{
              title: t.payments.empty,
              description: buildTableSectionTitle(locale, 'Nenhum pagamento recente para exibir neste momento.', 'No recent payments to display right now.')
            }}
          />
        </PageSection>
      </div>
    </div>
  );
}
