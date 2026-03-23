import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { FinanceCashMovement, FinanceInvoice, FinancePayment } from '@/shared/types/finance';

export type FinanceInvoiceCreateRequest = {
  sourceModule?: string;
  counterpartyReferenceType?: string;
  counterpartyReferenceId?: string;
  counterpartyName?: string;
  businessContextType?: string;
  businessContextId?: string;
  description?: string;
  status?: string;
  currency: string;
  totalAmount: number;
  issuedAt?: string;
  dueAt?: string;
};

type FinanceInvoiceFilters = {
  status?: string;
  sourceModule?: string;
  businessContextId?: string;
};

type FinancePaymentFilters = {
  invoiceId?: string;
  status?: string;
  method?: string;
};

type FinanceCashMovementFilters = {
  invoiceId?: string;
  paymentId?: string;
  direction?: string;
  category?: string;
};

function queryString(
  page = 0,
  size = 20,
  filters: Record<string, string | undefined> = {}
) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value.trim()) {
      params.set(key, value.trim());
    }
  });

  return params.toString();
}

export const financeService = {
  listInvoices: (page = 0, size = 20, filters: FinanceInvoiceFilters = {}) =>
    apiClient.get<PageResponse<FinanceInvoice>>(
      `/finance/invoices?${queryString(page, size, {
        status: filters.status,
        sourceModule: filters.sourceModule,
        businessContextId: filters.businessContextId
      })}`
    ),

  getInvoice: (id: string) => apiClient.get<FinanceInvoice>(`/finance/invoices/${id}`),

  createInvoice: (request: FinanceInvoiceCreateRequest) =>
    apiClient.post<FinanceInvoice>('/finance/invoices', request),

  listPayments: (page = 0, size = 20, filters: FinancePaymentFilters = {}) =>
    apiClient.get<PageResponse<FinancePayment>>(
      `/finance/payments?${queryString(page, size, {
        invoiceId: filters.invoiceId,
        status: filters.status,
        method: filters.method
      })}`
    ),

  listCashMovements: (page = 0, size = 20, filters: FinanceCashMovementFilters = {}) =>
    apiClient.get<PageResponse<FinanceCashMovement>>(
      `/finance/cash-movements?${queryString(page, size, {
        invoiceId: filters.invoiceId,
        paymentId: filters.paymentId,
        direction: filters.direction,
        category: filters.category
      })}`
    )
};
