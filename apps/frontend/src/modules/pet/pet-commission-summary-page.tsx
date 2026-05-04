'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import {
  ClientPlan,
  PetCommissionSummary,
  PetCommissionSummaryDetail,
  PetCommissionSummaryProfessional,
  PetInvoice
} from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';

const locale = 'pt-BR';
const allProfessionalsOption = '__all__';
const compatibilityOption = '__compatibility__';

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildDefaultFrom(): string {
  const now = new Date();
  return toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

function buildDefaultTo(): string {
  const now = new Date();
  return toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

function toIsoBoundary(date: string, boundary: 'start' | 'end') {
  if (!date) {
    return undefined;
  }

  return new Date(`${date}T${boundary === 'start' ? '00:00:00' : '23:59:59'}`).toISOString();
}

function formatCurrency(value?: number | null) {
  return (value ?? 0).toLocaleString(locale, { style: 'currency', currency: 'BRL' });
}

function formatCommissionRate(value?: number | null) {
  if (value == null) {
    return 'Taxa indisponivel';
  }

  return `${(value * 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function resolveLineStatusCopy(status: PetCommissionSummaryDetail['lineStatus']) {
  switch (status) {
    case 'GENERATED':
      return {
        label: 'Gerou comissao',
        detail: 'Entrou no total por profissional.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
      };
    case 'EXCLUDED':
      return {
        label: 'Excluida',
        detail: 'Servico fora da regra de comissao.',
        className: 'border-slate-200 bg-slate-100 text-slate-700'
      };
    case 'ELIGIBLE_WITHOUT_AMOUNT':
      return {
        label: 'Elegivel sem valor',
        detail: 'Linha elegivel sem comissao gerada.',
        className: 'border-amber-200 bg-amber-50 text-amber-700'
      };
    case 'UNASSIGNED':
      return {
        label: 'Sem profissional',
        detail: 'A linha ainda nao tem atribuicao segura.',
        className: 'border-amber-200 bg-amber-50 text-amber-700'
      };
    case 'LEGACY_UNAVAILABLE':
      return {
        label: 'Compatibilidade',
        detail: 'Linha historica ainda sem snapshot completo.',
        className: 'border-rose-200 bg-rose-50 text-rose-700'
      };
    default:
      return {
        label: status,
        detail: 'Sem classificacao adicional.',
        className: 'border-slate-200 bg-slate-100 text-slate-700'
      };
  }
}

function resolveDataSourceCopy(source: PetCommissionSummaryDetail['dataSource']) {
  return source === 'COMPATIBILITY_FALLBACK'
    ? 'Compatibilidade historica'
    : 'Linha estruturada';
}

export function PetCommissionSummaryPage() {
  const [dateFrom, setDateFrom] = useState(buildDefaultFrom);
  const [dateTo, setDateTo] = useState(buildDefaultTo);
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState(allProfessionalsOption);
  const [report, setReport] = useState<PetCommissionSummary | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<PetInvoice[]>([]);
  const [endingPlans, setEndingPlans] = useState<ClientPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);

    try {
      const [result, invoicesPage, plansPage] = await Promise.all([
        petService.getCommissionSummary({
          scheduledFrom: toIsoBoundary(from, 'start'),
          scheduledTo: toIsoBoundary(to, 'end')
        }),
        petService.listInvoices(0, 100, '', { status: 'ISSUED' }),
        petService.listClientPlans(undefined, 0, 100)
      ]);
      setReport(result);
      setPendingInvoices(resolvePageItems(invoicesPage).filter((invoice) => invoice.status !== 'PAID' && invoice.status !== 'CANCELED' && invoice.outstandingAmount > 0));
      setEndingPlans(resolvePageItems(plansPage).filter((plan) => plan.remainingSessions > 0 && plan.remainingSessions <= 2));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar o fechamento operacional.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(dateFrom, dateTo);
  }, [dateFrom, dateTo, load]);

  const professionalOptions = useMemo(() => {
    const options = [{ value: allProfessionalsOption, label: 'Todos os profissionais' }];

    if (report) {
      options.push(...report.professionals.map((row) => ({
        value: row.professionalId,
        label: row.professionalName
      })));

      if (report.unassignedLineCount > 0 || report.legacyLineCount > 0) {
        options.push({
          value: compatibilityOption,
          label: 'Compatibilidade e linhas sem atribuicao'
        });
      }
    }

    return options;
  }, [report]);

  useEffect(() => {
    if (!professionalOptions.some((option) => option.value === selectedProfessionalFilter)) {
      setSelectedProfessionalFilter(allProfessionalsOption);
    }
  }, [professionalOptions, selectedProfessionalFilter]);

  const summaryRows = report?.professionals ?? [];
  const pendingChargeTotal = pendingInvoices.reduce((total, invoice) => total + invoice.outstandingAmount, 0);
  const detailRows = useMemo(() => {
    if (!report) {
      return [];
    }

    if (selectedProfessionalFilter === allProfessionalsOption) {
      return report.details;
    }

    if (selectedProfessionalFilter === compatibilityOption) {
      return report.details.filter((detail) => (
        detail.professionalId == null || detail.lineStatus === 'LEGACY_UNAVAILABLE'
      ));
    }

    return report.details.filter((detail) => detail.professionalId === selectedProfessionalFilter);
  }, [report, selectedProfessionalFilter]);

  const summaryColumns: DataTableColumn<PetCommissionSummaryProfessional>[] = [
    {
      key: 'professional',
      header: 'Profissional',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.professionalName}</p>
          <p className="text-xs text-slate-700">
            {row.contributingAppointmentCount} atendimento(s) com impacto no total.
          </p>
        </div>
      )
    },
    {
      key: 'generated',
      header: 'Total gerado',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{formatCurrency(row.totalCommissionAmount)}</p>
          <p className="text-xs text-slate-700">{row.generatedLineCount} linha(s) com comissao.</p>
        </div>
      )
    },
    {
      key: 'excluded',
      header: 'Excluidas',
      render: (row) => row.excludedLineCount
    },
    {
      key: 'pending',
      header: 'Elegiveis sem valor',
      render: (row) => row.eligibleWithoutAmountLineCount
    },
    {
      key: 'appointments',
      header: 'Atendimentos contribuintes',
      render: (row) => row.contributingAppointmentCount
    }
  ];

  const detailColumns: DataTableColumn<PetCommissionSummaryDetail>[] = [
    {
      key: 'appointment',
      header: 'Atendimento',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{formatDateTime(row.scheduledAt)}</p>
          <p className="text-xs text-slate-700">
            {row.clientName} - {row.petName}
          </p>
          <p className="text-xs text-slate-500">{row.appointmentId}</p>
        </div>
      )
    },
    {
      key: 'serviceLine',
      header: 'Linha de servico',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.serviceName}</p>
          <p className="text-xs text-slate-700">Linha {row.lineOrder + 1}</p>
          <p className="text-xs text-slate-700">
            Base {row.basePrice != null ? formatCurrency(row.basePrice) : 'indisponivel'}
          </p>
        </div>
      )
    },
    {
      key: 'professional',
      header: 'Responsavel',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.professionalName ?? 'Sem atribuicao segura'}</p>
          <p className="text-xs text-slate-700">{row.appointmentStatus}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Situacao',
      render: (row) => {
        const copy = resolveLineStatusCopy(row.lineStatus);

        return (
          <div className="space-y-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${copy.className}`}>
              {copy.label}
            </span>
            <p className="text-xs text-slate-700">{copy.detail}</p>
          </div>
        );
      }
    },
    {
      key: 'commission',
      header: 'Comissao',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {row.commissionAmount != null ? formatCurrency(row.commissionAmount) : '-'}
          </p>
          <p className="text-xs text-slate-700">{formatCommissionRate(row.commissionRate)}</p>
        </div>
      )
    },
    {
      key: 'source',
      header: 'Fonte',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{resolveDataSourceCopy(row.dataSource)}</p>
          <p className="text-xs text-slate-700">
            {row.commissionEligible == null
              ? 'Snapshot historico incompleto.'
              : row.commissionEligible
                ? 'Linha apta a gerar comissao.'
                : 'Linha fora da regra de comissao.'}
          </p>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.commission.read"
      fallback={<div className="ui-notice-warning">Voce nao tem permissao para visualizar o resumo de comissoes.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Fechamento operacional"
          description="Leia atendimentos concluidos, comissoes por profissional, cobrancas pendentes e planos perto de terminar no mesmo recorte operacional de Banho e Tosa."
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total gerado</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatCurrency(report?.totalCommissionAmount)}
            </p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Profissionais visiveis</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.professionalCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Linhas com comissao</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.generatedLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Atendimentos concluidos</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.contributingAppointmentCount ?? 0}</p>
          </div>
        </div>

        <PageSection
          tone="muted"
          title="Filtro do periodo"
          description="O primeiro passo seguro considera atendimentos concluidos e mostra o que gerou comissao, o que ficou excluido e o que ainda depende de compatibilidade historica."
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
                Atualizar resumo
              </button>
            </div>
          </div>
        </PageSection>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <PageSection
          tone="muted"
          title="Fechamento de Banho e Tosa"
          description="Visao simples para fechar o dia: o que concluiu, quanto ha em aberto e quais planos precisam de renovacao operacional."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Concluidos no periodo</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{report?.contributingAppointmentCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-600">Base do fechamento e das comissoes.</p>
            </div>
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Comissoes</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(report?.totalCommissionAmount)}</p>
              <p className="mt-1 text-xs text-slate-600">Total gerado por linha elegivel.</p>
            </div>
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cobrancas pendentes</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{pendingInvoices.length}</p>
              <p className="mt-1 text-xs text-slate-600">{formatCurrency(pendingChargeTotal)} em aberto.</p>
            </div>
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Planos perto do fim</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{endingPlans.length}</p>
              <p className="mt-1 text-xs text-slate-600">Ultimos ou penultimos usos.</p>
            </div>
          </div>
        </PageSection>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Linhas excluidas</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.excludedLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Elegiveis sem valor</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.eligibleWithoutAmountLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sem profissional</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.unassignedLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Compatibilidade historica</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.legacyLineCount ?? 0}</p>
          </div>
        </div>

        <PageSection
          title="Resumo por profissional"
          description="Somente linhas elegiveis com valor de comissao entram no total. Linhas excluidas e elegiveis sem valor aparecem ao lado para leitura operacional."
        >
          <DataTable
            columns={summaryColumns}
            rows={summaryRows}
            getRowKey={(row) => row.professionalId}
            loading={loading}
            emptyMessage="Nenhuma linha concluida foi encontrada no periodo informado."
          />
        </PageSection>

        <PageSection
          title="Detalhe das linhas"
          description="Use este detalhe para entender quais linhas entraram no total, quais ficaram excluidas e onde ainda existe dependencia de compatibilidade historica."
        >
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,20rem)_1fr]">
            <FormSelect
              label="Profissional"
              value={selectedProfessionalFilter}
              options={professionalOptions}
              onChange={setSelectedProfessionalFilter}
              description="Filtre por um profissional especifico ou veja apenas as linhas ainda sem atribuicao segura."
            />
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                {detailRows.length} linha(s) visiveis neste recorte.
              </p>
            </div>
          </div>

          <DataTable
            columns={detailColumns}
            rows={detailRows}
            getRowKey={(row) => row.appointmentServiceLineId ?? `${row.appointmentId}-${row.serviceId}-${row.lineOrder}`}
            loading={loading}
            emptyMessage="Nenhuma linha corresponde ao filtro atual."
          />
        </PageSection>
      </div>
    </PermissionGuard>
  );
}
