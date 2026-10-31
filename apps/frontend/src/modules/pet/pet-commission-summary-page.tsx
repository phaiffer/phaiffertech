'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
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
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

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

function formatCommissionRate(screenCopy: AppMessages['screens']['petCommissions'], value?: number | null) {
  if (value == null) {
    return screenCopy.rateUnavailable;
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

function resolveLineStatusCopy(screenCopy: AppMessages['screens']['petCommissions'], status: PetCommissionSummaryDetail['lineStatus']) {
  switch (status) {
    case 'GENERATED':
      return {
        label: screenCopy.lineGenerated,
        detail: screenCopy.lineGeneratedDetail,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
      };
    case 'EXCLUDED':
      return {
        label: screenCopy.lineExcluded,
        detail: screenCopy.lineExcludedDetail,
        className: 'border-slate-200 bg-slate-100 text-slate-700'
      };
    case 'ELIGIBLE_WITHOUT_AMOUNT':
      return {
        label: screenCopy.lineEligibleNoAmount,
        detail: screenCopy.lineEligibleNoAmountDetail,
        className: 'border-amber-200 bg-amber-50 text-amber-700'
      };
    case 'UNASSIGNED':
      return {
        label: screenCopy.lineUnassigned,
        detail: screenCopy.lineUnassignedDetail,
        className: 'border-amber-200 bg-amber-50 text-amber-700'
      };
    case 'LEGACY_UNAVAILABLE':
      return {
        label: screenCopy.lineLegacy,
        detail: screenCopy.lineLegacyDetail,
        className: 'border-rose-200 bg-rose-50 text-rose-700'
      };
    default:
      return {
        label: status,
        detail: screenCopy.lineNoClassification,
        className: 'border-slate-200 bg-slate-100 text-slate-700'
      };
  }
}

function resolveDataSourceCopy(screenCopy: AppMessages['screens']['petCommissions'], source: PetCommissionSummaryDetail['dataSource']) {
  return source === 'COMPATIBILITY_FALLBACK'
    ? screenCopy.legacyData
    : screenCopy.structuredLine;
}

export function PetCommissionSummaryPage() {
  const screenCopy = useAppMessages().screens.petCommissions;
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
      setError(resolveApiErrorMessage(err, screenCopy.loadError));
    } finally {
      setLoading(false);
    }
  }, [screenCopy]);

  useEffect(() => {
    void load(dateFrom, dateTo);
  }, [dateFrom, dateTo, load]);

  const professionalOptions = useMemo(() => {
    const options = [{ value: allProfessionalsOption, label: screenCopy.allProfessionals }];

    if (report) {
      options.push(...report.professionals.map((row) => ({
        value: row.professionalId,
        label: row.professionalName
      })));

      if (report.unassignedLineCount > 0 || report.legacyLineCount > 0) {
        options.push({
          value: compatibilityOption,
          label: screenCopy.legacyAndUnassigned
        });
      }
    }

    return options;
  }, [report, screenCopy]);

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
      header: screenCopy.professional,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.professionalName}</p>
          <p className="text-xs text-slate-700">
            {row.contributingAppointmentCount} {screenCopy.appointmentsInTotal}
          </p>
        </div>
      )
    },
    {
      key: 'generated',
      header: screenCopy.metricTotal,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{formatCurrency(row.totalCommissionAmount)}</p>
          <p className="text-xs text-slate-700">{row.generatedLineCount} {screenCopy.linesWithCommission}</p>
        </div>
      )
    },
    {
      key: 'excluded',
      header: screenCopy.columnExcluded,
      render: (row) => row.excludedLineCount
    },
    {
      key: 'pending',
      header: screenCopy.eligibleNoAmount,
      render: (row) => row.eligibleWithoutAmountLineCount
    },
    {
      key: 'appointments',
      header: screenCopy.columnContributingAppointments,
      render: (row) => row.contributingAppointmentCount
    }
  ];

  const detailColumns: DataTableColumn<PetCommissionSummaryDetail>[] = [
    {
      key: 'appointment',
      header: screenCopy.columnAppointment,
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
      header: screenCopy.columnServiceLine,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.serviceName}</p>
          <p className="text-xs text-slate-700">{screenCopy.line} {row.lineOrder + 1}</p>
          <p className="text-xs text-slate-700">
            {screenCopy.base} {row.basePrice != null ? formatCurrency(row.basePrice) : 'indisponivel'}
          </p>
        </div>
      )
    },
    {
      key: 'professional',
      header: screenCopy.columnResponsible,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.professionalName ?? screenCopy.noConfirmedProfessional}</p>
          <StatusBadge status={row.appointmentStatus} />
        </div>
      )
    },
    {
      key: 'status',
      header: screenCopy.columnSituation,
      render: (row) => {
        const copy = resolveLineStatusCopy(screenCopy, row.lineStatus);

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
      header: screenCopy.columnCommission,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {row.commissionAmount != null ? formatCurrency(row.commissionAmount) : '-'}
          </p>
          <p className="text-xs text-slate-700">{formatCommissionRate(screenCopy, row.commissionRate)}</p>
        </div>
      )
    },
    {
      key: 'source',
      header: screenCopy.columnSource,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{resolveDataSourceCopy(screenCopy, row.dataSource)}</p>
          <p className="text-xs text-slate-700">
            {row.commissionEligible == null
              ? screenCopy.incompleteLegacy
              : row.commissionEligible
                ? screenCopy.lineEligible
                : screenCopy.lineOutsideRule}
          </p>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.commission.read"
      fallback={<div className="ui-notice-warning">{screenCopy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="Gestão Pet"
          title={screenCopy.title}
          description={screenCopy.description}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.metricTotal}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatCurrency(report?.totalCommissionAmount)}
            </p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.metricProfessionals}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.professionalCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.metricLines}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.generatedLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.metricCompleted}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.contributingAppointmentCount ?? 0}</p>
          </div>
        </div>

        <PageSection
          tone="muted"
          title={screenCopy.periodFilter}
          description={screenCopy.periodFilterDescription}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <FormInput label={screenCopy.from} type="date" value={dateFrom} onChange={setDateFrom} />
            <FormInput label={screenCopy.to} type="date" value={dateTo} onChange={setDateTo} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void load(dateFrom, dateTo)}
                className="ui-primary-button"
              >
                {screenCopy.refresh}
              </button>
            </div>
          </div>
        </PageSection>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <PageSection
          tone="muted"
          title={screenCopy.groomingClosing}
          description={screenCopy.groomingClosingDescription}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.completedInPeriod}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{report?.contributingAppointmentCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-600">{screenCopy.completedInPeriodDetail}</p>
            </div>
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.commissions}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(report?.totalCommissionAmount)}</p>
              <p className="mt-1 text-xs text-slate-600">{screenCopy.commissionsDetail}</p>
            </div>
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.pendingCharges}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{pendingInvoices.length}</p>
              <p className="mt-1 text-xs text-slate-600">{formatCurrency(pendingChargeTotal)} {screenCopy.open}</p>
            </div>
            <div className="ui-surface-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.plansNearEnd}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{endingPlans.length}</p>
              <p className="mt-1 text-xs text-slate-600">{screenCopy.plansNearEndDetail}</p>
            </div>
          </div>
        </PageSection>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.excludedLines}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.excludedLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.eligibleNoAmount}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.eligibleWithoutAmountLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.lineUnassigned}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.unassignedLineCount ?? 0}</p>
          </div>
          <div className="ui-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{screenCopy.legacyData}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{report?.legacyLineCount ?? 0}</p>
          </div>
        </div>

        <PageSection
          title={screenCopy.byProfessional}
          description={screenCopy.byProfessionalDescription}
        >
          <DataTable
            columns={summaryColumns}
            rows={summaryRows}
            getRowKey={(row) => row.professionalId}
            loading={loading}
            emptyMessage={screenCopy.noLinesInPeriod}
          />
        </PageSection>

        <PageSection
          title={screenCopy.lineDetail}
          description={screenCopy.lineDetailDescription}
        >
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,20rem)_1fr]">
            <FormSelect
              label={screenCopy.professional}
              value={selectedProfessionalFilter}
              options={professionalOptions}
              onChange={setSelectedProfessionalFilter}
              description={screenCopy.professionalFilterHint}
            />
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                {detailRows.length} {screenCopy.visibleLines}
              </p>
            </div>
          </div>

          <DataTable
            columns={detailColumns}
            rows={detailRows}
            getRowKey={(row) => row.appointmentServiceLineId ?? `${row.appointmentId}-${row.serviceId}-${row.lineOrder}`}
            loading={loading}
            emptyMessage={screenCopy.noMatchingLines}
          />
        </PageSection>
      </div>
    </PermissionGuard>
  );
}
