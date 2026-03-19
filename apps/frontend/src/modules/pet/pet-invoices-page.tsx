'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue,
  resolvePetLookupLabel
} from '@/modules/pet/pet-lookup-feedback';
import { CreatePetInvoicePaymentInput, petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetClient, PetInvoice } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'ISSUED', label: 'ISSUED' },
  { value: 'PAID', label: 'PAID' },
  { value: 'CANCELED', label: 'CANCELED' }
];

const formStatusOptions = [
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'ISSUED', label: 'ISSUED' },
  { value: 'CANCELED', label: 'CANCELED' }
];

const paymentMethodOptions = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'BANK_TRANSFER', label: 'Transferência' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'OTHER', label: 'Outro' }
];

const initialPage: PageResponse<PetInvoice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function toDateTimeLocal(isoValue?: string | null) {
  if (!isoValue) {
    return '';
  }

  const date = new Date(isoValue);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  if (!value) {
    return undefined;
  }
  return new Date(value).toISOString();
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Nao emitida';
  }
  return new Date(value).toLocaleString('pt-BR');
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function nowLocalDateTime() {
  return toDateTimeLocal(new Date().toISOString());
}

export function PetInvoicesPage() {
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<PetInvoice>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [status, setStatus] = useState('ISSUED');
  const [issuedAt, setIssuedAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [paymentInvoice, setPaymentInvoice] = useState<PetInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paymentReceivedAt, setPaymentReceivedAt] = useState(nowLocalDateTime());
  const [paymentReferenceCode, setPaymentReferenceCode] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetInvoice | null>(null);
  const canReadClients = hasPermission('pet.client.read');

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
    ];
  }, [clients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um cliente' },
      ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
    ];
  }, [clients]);

  const loadClients = useCallback(async () => {
    if (!canReadClients) {
      setClients([]);
      setLookupIssues([{ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(null, 'pet.client.read') }]);
      return;
    }

    try {
      const result = await petService.listClients(0, 200, '');
      setClients(resolvePageItems(result));
      setLookupIssues([]);
    } catch (err) {
      setClients([]);
      setLookupIssues([{ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(err) }]);
    }
  }, [canReadClients]);

  const load = useCallback(async (page: number, currentSearch: string, currentClientId: string, currentStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listInvoices(page, pageSize, currentSearch, {
        clientId: currentClientId || undefined,
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar faturas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    load(0, search, clientFilterId, statusFilter);
  }, [load, search, clientFilterId, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setTotalAmount('');
    setStatus('ISSUED');
    setIssuedAt('');
    setDueAt('');
    setDescription('');
  }

  function resetPaymentForm() {
    setPaymentInvoice(null);
    setPaymentAmount('');
    setPaymentMethod('PIX');
    setPaymentReceivedAt(nowLocalDateTime());
    setPaymentReferenceCode('');
    setPaymentNotes('');
  }

  function beginEdit(item: PetInvoice) {
    if (item.status === 'PAID') {
      setError('Invoices pagas devem ser ajustadas via novo documento ou acerto financeiro controlado.');
      return;
    }

    setEditingId(item.id);
    setClientId(item.clientId);
    setTotalAmount(String(item.totalAmount));
    setStatus(item.status === 'PAID' ? 'ISSUED' : item.status);
    setIssuedAt(toDateTimeLocal(item.issuedAt));
    setDueAt(toDateTimeLocal(item.dueAt));
    setDescription(item.description ?? '');
    setError(null);
    setSuccess(null);
  }

  function beginPayment(item: PetInvoice) {
    setPaymentInvoice(item);
    setPaymentAmount(String(item.outstandingAmount > 0 ? item.outstandingAmount : item.totalAmount));
    setPaymentMethod('PIX');
    setPaymentReceivedAt(nowLocalDateTime());
    setPaymentReferenceCode('');
    setPaymentNotes('');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTotal = Number(totalAmount);
    const isoIssuedAt = toIsoDate(issuedAt);
    const isoDueAt = toIsoDate(dueAt);
    if (!clientId || Number.isNaN(parsedTotal) || parsedTotal < 0) {
      setError('Selecione um cliente e informe um valor valido.');
      return;
    }
    if (status !== 'DRAFT' && !isoIssuedAt) {
      setError('Invoices emitidas ou canceladas precisam de data de emissao.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await petService.updateInvoice(editingId, {
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt,
          dueAt: isoDueAt,
          description: description || undefined
        });
        setSuccess('Fatura atualizada com sucesso.');
      } else {
        await petService.createInvoice({
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt,
          dueAt: isoDueAt,
          description: description || undefined
        });
        setSuccess('Fatura criada com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar fatura.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentInvoice) {
      return;
    }

    const parsedAmount = Number(paymentAmount);
    const isoReceivedAt = toIsoDate(paymentReceivedAt);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0 || !isoReceivedAt) {
      setError('Informe valor e data validos para registrar o pagamento.');
      return;
    }

    const input: CreatePetInvoicePaymentInput = {
      amount: parsedAmount,
      method: paymentMethod,
      receivedAt: isoReceivedAt,
      referenceCode: paymentReferenceCode || undefined,
      notes: paymentNotes || undefined
    };

    setPaymentSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await petService.createInvoicePayment(paymentInvoice.id, input);
      setSuccess('Pagamento registrado com sucesso.');
      resetPaymentForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao registrar pagamento.');
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteInvoice(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Fatura removida com sucesso.');
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir fatura.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');

  const columns: DataTableColumn<PetInvoice>[] = [
    {
      key: 'issuedAt',
      header: 'Emissao',
      render: (item) => (
        <div className="space-y-1">
          <div>{formatDateTime(item.issuedAt)}</div>
          <div className="text-xs text-[color:var(--app-shell-muted)]">
            Vencimento: {item.dueAt ? formatDateTime(item.dueAt) : 'Nao definido'}
          </div>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (item) =>
        item.clientName ??
        resolvePetLookupLabel(
          clients,
          item.clientId,
          (client) => client.name ?? client.fullName,
          'Cliente',
          clientsLookupUnavailable
        )
    },
    {
      key: 'context',
      header: 'Contexto',
      render: (item) => (
        <div className="space-y-1">
          <div>{item.businessContextLabel ?? item.description ?? 'Sem contexto vinculado'}</div>
          <div className="text-xs text-[color:var(--app-shell-muted)]">{item.financeInvoiceId}</div>
        </div>
      )
    },
    {
      key: 'amounts',
      header: 'Financeiro',
      render: (item) => (
        <div className="space-y-1 text-sm">
          <div>Total: {formatCurrency(item.totalAmount)}</div>
          <div>Pago: {formatCurrency(item.paidAmount)}</div>
          <div className="font-semibold">Aberto: {formatCurrency(item.outstandingAmount)}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <div className="space-y-1">
          <div>{item.status}</div>
          {item.paidAt ? (
            <div className="text-xs text-[color:var(--app-shell-muted)]">Pago em {formatDateTime(item.paidAt)}</div>
          ) : null}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acoes',
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission="pet.invoice.update">
            {item.status !== 'PAID' ? (
              <button
                type="button"
                onClick={() => beginEdit(item)}
                className="ui-inline-button"
              >
                Editar
              </button>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.update">
            {item.status !== 'PAID' && item.status !== 'CANCELED' && item.outstandingAmount > 0 ? (
              <button
                type="button"
                onClick={() => beginPayment(item)}
                className="ui-inline-button"
              >
                Registrar pagamento
              </button>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.invoice.read"
      fallback={<div className="ui-notice-warning">Voce nao possui permissao para visualizar faturas.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="Pet Invoices"
          description="Base financeira tenant-scoped do PetFlow, com saldo em aberto e registro de pagamentos sem duplicar o ledger."
        />

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_240px_180px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Pesquisar cliente, contexto ou documento" />
          <FormSelect label="Cliente" value={clientFilterId} options={clientOptions} onChange={setClientFilterId} disabled={clientsLookupUnavailable} />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <button
            type="button"
            onClick={() => setSearch(searchInput)}
            className="ui-primary-button"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setClientFilterId('');
              setStatusFilter('');
            }}
            className="ui-secondary-button"
          >
            Limpar
          </button>
        </div>

        <PetLookupFeedback issues={lookupIssues} />

        <PermissionGuard permission={editingId ? 'pet.invoice.update' : 'pet.invoice.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormSelect label="Cliente" value={clientId} options={formClientOptions} onChange={setClientId} disabled={clientsLookupUnavailable} />
            <FormInput label="Valor total" value={totalAmount} onChange={setTotalAmount} type="number" required />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <DateTimeInput label="Emitida em" value={issuedAt} onChange={setIssuedAt} required={status !== 'DRAFT'} />
            <DateTimeInput label="Vencimento" value={dueAt} onChange={setDueAt} />
            <FormInput label="Descricao" value={description} onChange={setDescription} placeholder="Contexto comercial ou observacao" />

            <div className="md:col-span-2 flex gap-2">
              {clientsLookupUnavailable ? (
                <div className="w-full ui-notice-warning">
                  O formulario depende da referencia de clientes para emitir ou editar faturas.
                </div>
              ) : null}
              <button
                type="submit"
                disabled={submitting || clientsLookupUnavailable}
                className="ui-primary-button"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar fatura' : 'Criar fatura'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ui-secondary-button"
                >
                  Cancelar edicao
                </button>
              ) : null}
            </div>
          </form>
        </PermissionGuard>

        {paymentInvoice ? (
          <PermissionGuard permission="pet.invoice.update">
            <form onSubmit={handlePaymentSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                    Registrar pagamento para {paymentInvoice.clientName ?? paymentInvoice.clientId}
                  </div>
                  <div className="text-sm text-[color:var(--app-shell-muted)]">
                    Aberto: {formatCurrency(paymentInvoice.outstandingAmount)} | Contexto: {paymentInvoice.businessContextLabel ?? 'sem vinculo'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="ui-secondary-button"
                >
                  Fechar
                </button>
              </div>

              <FormInput label="Valor recebido" value={paymentAmount} onChange={setPaymentAmount} type="number" required />
              <FormSelect label="Metodo" value={paymentMethod} options={paymentMethodOptions} onChange={setPaymentMethod} />
              <DateTimeInput label="Recebido em" value={paymentReceivedAt} onChange={setPaymentReceivedAt} required />
              <FormInput label="Referencia" value={paymentReferenceCode} onChange={setPaymentReferenceCode} placeholder="PIX, NSU ou comprovante" />
              <FormInput label="Observacoes" value={paymentNotes} onChange={setPaymentNotes} placeholder="Notas operacionais do caixa" />

              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="ui-primary-button"
                >
                  {paymentSubmitting ? 'Registrando...' : 'Confirmar pagamento'}
                </button>
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Historico de pagamentos</div>
                {paymentInvoice.payments.length === 0 ? (
                  <div className="ui-notice-warning">Nenhum pagamento registrado nesta invoice.</div>
                ) : (
                  paymentInvoice.payments.map((payment) => (
                    <div key={payment.id} className="rounded-[var(--radius-md)] border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-surface-muted)] p-3 text-sm">
                      <div className="font-semibold">
                        {formatCurrency(payment.amount)} via {payment.method}
                      </div>
                      <div className="text-[color:var(--app-shell-muted)]">
                        {payment.status} em {formatDateTime(payment.receivedAt)}
                      </div>
                      {payment.referenceCode ? <div className="text-[color:var(--app-shell-muted)]">Ref: {payment.referenceCode}</div> : null}
                      {payment.notes ? <div className="text-[color:var(--app-shell-muted)]">{payment.notes}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </form>
          </PermissionGuard>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma fatura encontrada." />
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(page) => load(page, search, clientFilterId, statusFilter)}
        />

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir fatura?"
          description={deleteCandidate ? `A fatura ${deleteCandidate.financeInvoiceId} sera removida.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
