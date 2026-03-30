'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Download,
  Receipt,
  Banknote,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useI18n } from '@/shared/i18n/use-i18n';
import { usePermission } from '@/shared/auth/use-permission';
import { PageTitle } from '@/shared/ui/page-title';
import { PageSection } from '@/shared/ui/page-section';
import { MetricGrid, MetricCard } from '@/shared/dashboard/metric-grid';
import { DataTable } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { cn, formatCurrency, formatDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

// Types
interface CashMovement {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
  reference?: {
    type: string;
    id: string;
  };
}

interface FinanceInvoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELED';
  issuedAt: string;
  dueAt: string;
  paidAmount?: number;
}

interface FinancePayment {
  id: string;
  invoiceNumber?: string;
  clientName: string;
  amount: number;
  method: string;
  paidAt: string;
}

interface FinanceStats {
  todayBalance: number;
  todayIncome: number;
  todayExpenses: number;
  pendingPayments: number;
  monthRevenue: number;
  openInvoices: number;
}

// Mock data for demonstration - in production, this would come from the API
const mockStats: FinanceStats = {
  todayBalance: 3250.0,
  todayIncome: 4500.0,
  todayExpenses: 1250.0,
  pendingPayments: 2800.0,
  monthRevenue: 45600.0,
  openInvoices: 12,
};

const mockMovements: CashMovement[] = [
  {
    id: '1',
    direction: 'INBOUND',
    category: 'sale',
    amount: 150.0,
    description: 'Venda de racao premium',
    createdAt: new Date().toISOString(),
    createdBy: { id: '1', name: 'Maria Silva' },
  },
  {
    id: '2',
    direction: 'INBOUND',
    category: 'service',
    amount: 85.0,
    description: 'Banho e tosa - Rex',
    createdAt: new Date().toISOString(),
    createdBy: { id: '2', name: 'Joao Santos' },
  },
  {
    id: '3',
    direction: 'OUTBOUND',
    category: 'expense',
    amount: 320.0,
    description: 'Compra de shampoo profissional',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: { id: '1', name: 'Maria Silva' },
  },
  {
    id: '4',
    direction: 'INBOUND',
    category: 'service',
    amount: 120.0,
    description: 'Consulta veterinaria - Luna',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: { id: '3', name: 'Dr. Carlos' },
  },
  {
    id: '5',
    direction: 'OUTBOUND',
    category: 'withdrawal',
    amount: 500.0,
    description: 'Retirada para pagamento de fornecedor',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    createdBy: { id: '1', name: 'Maria Silva' },
  },
];

const mockInvoices: FinanceInvoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    clientName: 'Ana Costa',
    amount: 450.0,
    status: 'PAID',
    issuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    paidAmount: 450.0,
  },
  {
    id: '2',
    number: 'INV-2024-002',
    clientName: 'Pedro Oliveira',
    amount: 280.0,
    status: 'ISSUED',
    issuedAt: new Date(Date.now() - 86400000).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 10).toISOString(),
  },
  {
    id: '3',
    number: 'INV-2024-003',
    clientName: 'Julia Mendes',
    amount: 620.0,
    status: 'OVERDUE',
    issuedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    dueAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '4',
    number: 'INV-2024-004',
    clientName: 'Roberto Lima',
    amount: 180.0,
    status: 'PARTIALLY_PAID',
    issuedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    paidAmount: 100.0,
  },
];

const mockPayments: FinancePayment[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'Ana Costa',
    amount: 450.0,
    method: 'pix',
    paidAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    clientName: 'Marcos Souza',
    amount: 85.0,
    method: 'credit',
    paidAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    clientName: 'Carla Dias',
    amount: 120.0,
    method: 'debit',
    paidAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

// Category icons mapping
const categoryIcons: Record<string, typeof DollarSign> = {
  sale: Receipt,
  service: Calendar,
  refund: ArrowDownLeft,
  expense: TrendingDown,
  withdrawal: ArrowUpRight,
  deposit: ArrowDownLeft,
  adjustment: DollarSign,
  other: DollarSign,
};

// Status colors mapping
const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  ISSUED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELED: 'bg-muted text-muted-foreground line-through',
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  DRAFT: Clock,
  ISSUED: FileText,
  PAID: CheckCircle2,
  PARTIALLY_PAID: AlertCircle,
  OVERDUE: XCircle,
  CANCELED: XCircle,
};

export function FinanceDashboard() {
  const { messages } = useI18n();
  const t = messages.petFinance;
  const hasPermission = usePermission('finance.read');

  const [periodFilter, setPeriodFilter] = useState('today');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNewMovementDialog, setShowNewMovementDialog] = useState(false);
  const [newMovement, setNewMovement] = useState({
    direction: 'INBOUND' as 'INBOUND' | 'OUTBOUND',
    category: 'sale',
    amount: '',
    description: '',
  });

  // In production, these would be actual API calls
  const { data: stats, isLoading: statsLoading } = useSWR<FinanceStats>(
    hasPermission ? '/api/finance/stats' : null,
    () => Promise.resolve(mockStats),
    { fallbackData: mockStats }
  );

  const { data: movements, isLoading: movementsLoading } = useSWR<CashMovement[]>(
    hasPermission ? '/api/finance/movements' : null,
    () => Promise.resolve(mockMovements),
    { fallbackData: mockMovements }
  );

  const { data: invoices, isLoading: invoicesLoading } = useSWR<FinanceInvoice[]>(
    hasPermission ? '/api/finance/invoices' : null,
    () => Promise.resolve(mockInvoices),
    { fallbackData: mockInvoices }
  );

  const { data: payments, isLoading: paymentsLoading } = useSWR<FinancePayment[]>(
    hasPermission ? '/api/finance/payments' : null,
    () => Promise.resolve(mockPayments),
    { fallbackData: mockPayments }
  );

  // Filter movements
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    return movements.filter((m) => {
      if (directionFilter !== 'all' && m.direction !== directionFilter) return false;
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      return true;
    });
  }, [movements, directionFilter, categoryFilter]);

  const handleSaveMovement = () => {
    // In production, this would call the API
    console.log('Saving movement:', newMovement);
    setShowNewMovementDialog(false);
    setNewMovement({
      direction: 'INBOUND',
      category: 'sale',
      amount: '',
      description: '',
    });
  };

  if (!hasPermission) {
    return (
      <div className={sharedPageStackClass}>
        <PageTitle eyebrow={t.eyebrow} title={t.title} description={t.noPermission} />
      </div>
    );
  }

  const isLoading = statsLoading || movementsLoading || invoicesLoading || paymentsLoading;

  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t.actions.exportData}
            </Button>
            <Button size="sm" onClick={() => setShowNewMovementDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.actions.newMovement}
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <MetricGrid columns={3}>
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label={t.stats.todayBalance}
          value={formatCurrency(stats?.todayBalance ?? 0)}
          detail={
            <span className="flex items-center gap-1">
              {(stats?.todayIncome ?? 0) > (stats?.todayExpenses ?? 0) ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className="text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(stats?.todayIncome ?? 0)}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-red-600 dark:text-red-400">
                -{formatCurrency(stats?.todayExpenses ?? 0)}
              </span>
            </span>
          }
          variant="accent"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={t.stats.monthRevenue}
          value={formatCurrency(stats?.monthRevenue ?? 0)}
          detail={
            <span className="text-muted-foreground text-sm">
              {stats?.openInvoices ?? 0} {t.stats.openInvoices.toLowerCase()}
            </span>
          }
        />
        <MetricCard
          icon={<CreditCard className="h-5 w-5" />}
          label={t.stats.pendingPayments}
          value={formatCurrency(stats?.pendingPayments ?? 0)}
          detail={
            <span className="text-amber-600 dark:text-amber-400 text-sm">
              {invoices?.filter((i) => i.status === 'OVERDUE').length ?? 0} faturas vencidas
            </span>
          }
        />
      </MetricGrid>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{t.filters.title}</span>
        </div>
        <FormSelect
          value={periodFilter}
          onValueChange={setPeriodFilter}
          options={[
            { label: t.filters.today, value: 'today' },
            { label: t.filters.thisWeek, value: 'week' },
            { label: t.filters.thisMonth, value: 'month' },
            { label: t.filters.lastMonth, value: 'lastMonth' },
          ]}
          placeholder={t.filters.period}
          className="w-40"
        />
        <FormSelect
          value={directionFilter}
          onValueChange={setDirectionFilter}
          options={[
            { label: t.filters.allDirections, value: 'all' },
            { label: t.cashMovements.inbound, value: 'INBOUND' },
            { label: t.cashMovements.outbound, value: 'OUTBOUND' },
          ]}
          placeholder={t.filters.direction}
          className="w-40"
        />
        <FormSelect
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          options={[
            { label: t.filters.allCategories, value: 'all' },
            { label: t.cashMovements.categories.sale, value: 'sale' },
            { label: t.cashMovements.categories.service, value: 'service' },
            { label: t.cashMovements.categories.expense, value: 'expense' },
            { label: t.cashMovements.categories.withdrawal, value: 'withdrawal' },
            { label: t.cashMovements.categories.deposit, value: 'deposit' },
          ]}
          placeholder={t.filters.category}
          className="w-40"
        />
      </div>

      {/* Cash Movements Section */}
      <PageSection title={t.cashMovements.title} description={t.cashMovements.description}>
        <DataTable
          loading={movementsLoading}
          loadingTitle={t.loading}
          emptyTitle={t.cashMovements.empty}
          emptyDescription={t.cashMovements.emptyDescription}
          columns={[
            {
              key: 'direction',
              header: t.filters.direction,
              width: '100px',
              render: (row: CashMovement) => {
                const isInbound = row.direction === 'INBOUND';
                return (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                      isInbound
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {isInbound ? (
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}
                    {isInbound ? t.cashMovements.inbound : t.cashMovements.outbound}
                  </div>
                );
              },
            },
            {
              key: 'category',
              header: t.filters.category,
              width: '120px',
              render: (row: CashMovement) => {
                const Icon = categoryIcons[row.category] || DollarSign;
                const categoryLabel =
                  t.cashMovements.categories[row.category as keyof typeof t.cashMovements.categories] ||
                  row.category;
                return (
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{categoryLabel}</span>
                  </div>
                );
              },
            },
            {
              key: 'description',
              header: t.form.description,
              render: (row: CashMovement) => (
                <div className="flex flex-col">
                  <span className="font-medium">{row.description}</span>
                  {row.createdBy && (
                    <span className="text-xs text-muted-foreground">por {row.createdBy.name}</span>
                  )}
                </div>
              ),
            },
            {
              key: 'amount',
              header: t.form.amount,
              width: '140px',
              render: (row: CashMovement) => (
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    row.direction === 'INBOUND'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {row.direction === 'INBOUND' ? '+' : '-'}
                  {formatCurrency(row.amount)}
                </span>
              ),
            },
            {
              key: 'createdAt',
              header: t.form.date,
              width: '120px',
              render: (row: CashMovement) => (
                <span className="text-muted-foreground text-sm">
                  {formatDate(row.createdAt, 'HH:mm')}
                </span>
              ),
            },
          ]}
          data={filteredMovements}
        />
      </PageSection>

      {/* Two column layout for invoices and payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoices Section */}
        <PageSection title={t.invoices.title} description={t.invoices.description}>
          <DataTable
            loading={invoicesLoading}
            loadingTitle={t.loading}
            emptyTitle={t.invoices.empty}
            columns={[
              {
                key: 'number',
                header: 'Fatura',
                render: (row: FinanceInvoice) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{row.number}</span>
                    <span className="text-xs text-muted-foreground">{row.clientName}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: t.invoices.title.split(' ')[0],
                width: '120px',
                render: (row: FinanceInvoice) => {
                  const Icon = statusIcons[row.status] || FileText;
                  const statusLabel =
                    t.invoices.status[
                      row.status.toLowerCase().replace('_', '') as keyof typeof t.invoices.status
                    ] || row.status;
                  return (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        statusColors[row.status]
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {statusLabel}
                    </div>
                  );
                },
              },
              {
                key: 'amount',
                header: t.form.amount,
                width: '100px',
                render: (row: FinanceInvoice) => (
                  <span className="font-semibold tabular-nums">{formatCurrency(row.amount)}</span>
                ),
              },
            ]}
            data={invoices ?? []}
          />
        </PageSection>

        {/* Payments Section */}
        <PageSection title={t.payments.title} description={t.payments.description}>
          <DataTable
            loading={paymentsLoading}
            loadingTitle={t.loading}
            emptyTitle={t.payments.empty}
            columns={[
              {
                key: 'client',
                header: 'Cliente',
                render: (row: FinancePayment) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{row.clientName}</span>
                    {row.invoiceNumber && (
                      <span className="text-xs text-muted-foreground">{row.invoiceNumber}</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'method',
                header: t.payment.method,
                width: '100px',
                render: (row: FinancePayment) => {
                  const methodLabel =
                    t.payments.methods[row.method as keyof typeof t.payments.methods] || row.method;
                  return (
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span>{methodLabel}</span>
                    </div>
                  );
                },
              },
              {
                key: 'amount',
                header: t.form.amount,
                width: '100px',
                render: (row: FinancePayment) => (
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(row.amount)}
                  </span>
                ),
              },
            ]}
            data={payments ?? []}
          />
        </PageSection>
      </div>

      {/* New Movement Dialog */}
      <Dialog open={showNewMovementDialog} onOpenChange={setShowNewMovementDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.actions.newMovement}</DialogTitle>
            <DialogDescription>{t.cashMovements.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="direction">{t.form.direction}</Label>
              <FormSelect
                value={newMovement.direction}
                onValueChange={(v) =>
                  setNewMovement({ ...newMovement, direction: v as 'INBOUND' | 'OUTBOUND' })
                }
                options={[
                  { label: t.cashMovements.inbound, value: 'INBOUND' },
                  { label: t.cashMovements.outbound, value: 'OUTBOUND' },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{t.form.category}</Label>
              <FormSelect
                value={newMovement.category}
                onValueChange={(v) => setNewMovement({ ...newMovement, category: v })}
                options={[
                  { label: t.cashMovements.categories.sale, value: 'sale' },
                  { label: t.cashMovements.categories.service, value: 'service' },
                  { label: t.cashMovements.categories.expense, value: 'expense' },
                  { label: t.cashMovements.categories.withdrawal, value: 'withdrawal' },
                  { label: t.cashMovements.categories.deposit, value: 'deposit' },
                  { label: t.cashMovements.categories.other, value: 'other' },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">{t.form.amount}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={newMovement.amount}
                onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t.form.description}</Label>
              <Textarea
                id="description"
                placeholder={t.form.descriptionPlaceholder}
                value={newMovement.description}
                onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMovementDialog(false)}>
              {t.form.cancel}
            </Button>
            <Button onClick={handleSaveMovement}>{t.form.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
