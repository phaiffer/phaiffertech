'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { petService } from '@/shared/services/pet-service';
import {
  PetCommissionSummary,
  PetCommissionSummaryDetail,
  PetCommissionSummaryProfessional
} from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

type DisplayLocale = 'pt-BR' | 'en-US';
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

function formatCurrency(locale: DisplayLocale, value?: number | null) {
  return (value ?? 0).toLocaleString(locale, { style: 'currency', currency: 'BRL' });
}

function formatCommissionRate(locale: DisplayLocale, screenCopy: AppMessages['screens']['petCommissions'], value?: number | null) {
  if (value == null) {
    return screenCopy.rateUnavailable;
  }

  return `${(value * 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function formatDateTime(locale: DisplayLocale, value: string) {
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
        className: 'text-[var(--ink-2)]'
      };
    case 'EXCLUDED':
      return {
        label: screenCopy.lineExcluded,
        detail: screenCopy.lineExcludedDetail,
        className: 'text-[var(--muted)]'
      };
    case 'ELIGIBLE_WITHOUT_AMOUNT':
      return {
        label: screenCopy.lineEligibleNoAmount,
        detail: screenCopy.lineEligibleNoAmountDetail,
        className: 'text-[var(--warn)]'
      };
    case 'UNASSIGNED':
      return {
        label: screenCopy.lineUnassigned,
        detail: screenCopy.lineUnassignedDetail,
        className: 'text-[var(--warn)]'
      };
    case 'LEGACY_UNAVAILABLE':
      return {
        label: screenCopy.lineLegacy,
        detail: screenCopy.lineLegacyDetail,
        className: 'text-[var(--danger)]'
      };
    default:
      return {
        label: status,
        detail: screenCopy.lineNoClassification,
        className: 'text-[var(--muted)]'
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
  const { locale } = useAppI18n();
  const [dateFrom, setDateFrom] = useState(buildDefaultFrom);
  const [dateTo, setDateTo] = useState(buildDefaultTo);
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState(allProfessionalsOption);
  const [report, setReport] = useState<PetCommissionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.getCommissionSummary({
        scheduledFrom: toIsoBoundary(from, 'start'),
        scheduledTo: toIsoBoundary(to, 'end')
      });
      setReport(result);
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
          <p className="font-medium text-slate-900">{formatCurrency(locale, row.totalCommissionAmount)}</p>
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
          <p className="font-medium text-slate-900">{formatDateTime(locale, row.scheduledAt)}</p>
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
            {screenCopy.base} {row.basePrice != null ? formatCurrency(locale, row.basePrice) : screenCopy.baseUnavailable}
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
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${copy.className}`}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
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
            {row.commissionAmount != null ? formatCurrency(locale, row.commissionAmount) : '-'}
          </p>
          <p className="text-xs text-slate-700">{formatCommissionRate(locale, screenCopy, row.commissionRate)}</p>
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
          title={screenCopy.title}
          description={screenCopy.description}
        />

        <dl className="grid gap-4 border-y border-[color:var(--line)] py-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [screenCopy.metricTotal, formatCurrency(locale, report?.totalCommissionAmount)],
            [screenCopy.metricProfessionals, String(report?.professionalCount ?? 0)],
            [screenCopy.metricLines, String(report?.generatedLineCount ?? 0)],
            [screenCopy.metricCompleted, String(report?.contributingAppointmentCount ?? 0)]
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[var(--muted)]">{label}</dt>
              <dd className="ui-mono mt-1 text-lg font-semibold text-[var(--ink)]">{value}</dd>
            </div>
          ))}
        </dl>

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

        <PageSection title={screenCopy.groomingClosing} description={screenCopy.groomingClosingDescription}>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [screenCopy.excludedLines, report?.excludedLineCount ?? 0],
              [screenCopy.eligibleNoAmount, report?.eligibleWithoutAmountLineCount ?? 0],
              [screenCopy.lineUnassigned, report?.unassignedLineCount ?? 0],
              [screenCopy.legacyData, report?.legacyLineCount ?? 0]
            ].map(([label, value]) => (
              <div key={label} className="border-t border-[color:var(--line)] pt-3">
                <dt className="text-xs text-[var(--muted)]">{label}</dt>
                <dd className="ui-mono mt-1 text-base font-semibold text-[var(--ink)]">{value}</dd>
              </div>
            ))}
          </dl>
        </PageSection>

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
