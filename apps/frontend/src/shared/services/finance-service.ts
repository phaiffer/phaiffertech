import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { FinanceCashMovement, FinanceInvoice } from '@/shared/types/finance';

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
  getInvoice: (id: string) => apiClient.get<FinanceInvoice>(`/finance/invoices/${id}`),

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
