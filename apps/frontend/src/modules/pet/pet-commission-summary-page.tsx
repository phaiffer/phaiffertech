'use client';

import { useCallback, useEffect, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { petService } from '@/shared/services/pet-service';
import { PetAppointment } from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { PageSection } from '@/shared/ui/page-section';
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
  for (const appointment of appointments) {
    const key = appointment.professionalId;
    const name = appointment.professionalName ?? appointment.professionalId;
    const commission = appointment.commissionAmount ?? 0;
    const existing = map.get(key);
    if (existing) {
      existing.appointmentCount += 1;
      existing.totalCommission += commission;
    } else {
      map.set(key, {
        professionalId: key,
        professionalName: name,
        appointmentCount: 1,
        totalCommission: commission
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalCommission - a.totalCommission);
}

const columns: DataTableColumn<CommissionRow>[] = [
  { key: 'professional', header: 'Profissional', render: (row) => row.professionalName },
  { key: 'count', header: 'Atendimentos concluidos', render: (row) => row.appointmentCount },
  {
    key: 'total',
    header: 'Comissao projetada',
    render: (row) => row.totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
      const result = await petService.listAppointments(0, 200, '', {
        status: 'COMPLETED',
        scheduledFrom: new Date(`${from}T00:00:00`).toISOString(),
        scheduledTo: new Date(`${to}T23:59:59`).toISOString()
      });
      setRows(groupByProfessional(result.items ?? []));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(dateFrom, dateTo);
  }, [load, dateFrom, dateTo]);

  const grandTotal = rows.reduce((sum, row) => sum + row.totalCommission, 0);
  const totalAppointments = rows.reduce((sum, row) => sum + row.appointmentCount, 0);

  return (
    <PermissionGuard
      permission="pet.appointment.read"
      fallback={<div className="ui-notice-warning">Voce nao tem permissao para visualizar comissoes.</div>}
    >
      <div className="space-y-5">
        <PetModuleSubnav />

        <PageTitle
          eyebrow="PetFlow workspace"
          title="Fechamento de comissoes"
          description="Mostre a producao de banho e tosa por profissional com valores projetados a partir dos atendimentos concluidos no periodo."
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Profissionais</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Servicos fechados</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{totalAppointments}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Comissao projetada</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
              {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <PageSection
          tone="muted"
          title="Periodo de fechamento"
          description="Use este recorte para explicar como a operacao transforma atendimento concluido em producao por profissional."
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <FormInput label="De" type="date" value={dateFrom} onChange={setDateFrom} />
            <FormInput label="Ate" type="date" value={dateTo} onChange={setDateTo} />
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
        </PageSection>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.professionalId}
          loading={loading}
          emptyState={{
            title: 'Nenhuma comissao no periodo',
            description: 'Conclua atendimentos de banho e tosa com profissional atribuido para demonstrar o fechamento de producao.'
          }}
        />

        {!loading && rows.length > 0 ? (
          <div className="flex items-center justify-end gap-3 ui-surface-panel p-4">
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
