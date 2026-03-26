'use client';

import { useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { petService } from '@/shared/services/pet-service';
import { PetAppointment } from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { PageTitle } from '@/shared/ui/page-title';

type CommissionRow = {
  professionalId: string;
  professionalName: string;
  appointmentCount: number;
  totalCommission: number;
};

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDefaultFrom(): string {
  const now = new Date();
  return toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

function buildDefaultTo(): string {
  const now = new Date();
  return toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

function groupByProfessional(appointments: PetAppointment[]): CommissionRow[] {
  const map = new Map<string, CommissionRow>();
  for (const appt of appointments) {
    const key = appt.professionalId;
    const name = appt.professionalName ?? appt.professionalId;
    const commission = appt.commissionAmount ?? 0;
    const existing = map.get(key);
    if (existing) {
      existing.appointmentCount += 1;
      existing.totalCommission += commission;
    } else {
      map.set(key, { professionalId: key, professionalName: name, appointmentCount: 1, totalCommission: commission });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalCommission - a.totalCommission);
}

const columns: DataTableColumn<CommissionRow>[] = [
  { key: 'professional', header: 'Profissional', render: (r) => r.professionalName },
  { key: 'count', header: 'Atendimentos', render: (r) => r.appointmentCount },
  {
    key: 'total',
    header: 'Total de Comissão (R$)',
    render: (r) => r.totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
];

export function PetCommissionSummaryPage() {
  const [dateFrom, setDateFrom] = useState<string>(buildDefaultFrom);
  const [dateTo, setDateTo] = useState<string>(buildDefaultTo);
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listAppointments(0, 500, '', {
        status: 'COMPLETED',
        scheduledFrom: `${from}T00:00:00.000Z`,
        scheduledTo: `${to}T23:59:59.999Z`
      });
      setRows(groupByProfessional(result.items ?? []));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(dateFrom, dateTo);
  }, [load, dateFrom, dateTo]);

  const grandTotal = rows.reduce((sum, r) => sum + r.totalCommission, 0);
  const totalAppointments = rows.reduce((sum, r) => sum + r.appointmentCount, 0);

  return (
    <PermissionGuard
      permission="pet.appointment.read"
      fallback={<div className="ui-notice-warning">Você não tem permissão para visualizar comissões.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Resumo de Comissoes"
          description="Total de comissoes por profissional em um periodo, com foco em fechamento simples e demonstravel."
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Profissionais</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Atendimentos concluidos</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{totalAppointments}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Total projetado</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
              {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_1fr_auto]">
          <FormInput label="De" type="date" value={dateFrom} onChange={setDateFrom} />
          <FormInput label="Até" type="date" value={dateTo} onChange={setDateTo} />
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void load(dateFrom, dateTo)}
              className="ui-primary-button"
            >
              Buscar
            </button>
          </div>
        </div>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.professionalId}
          loading={loading}
          emptyMessage="Nenhum atendimento concluído encontrado no período."
        />

        {!loading && rows.length > 0 ? (
          <div className="flex justify-end items-center gap-3 ui-surface-panel p-4">
            <span className="text-sm text-muted">Total geral</span>
            <span className="text-sm font-semibold text-foreground">
              {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
