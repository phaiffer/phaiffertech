'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarDays, DollarSign, Star, Users, type LucideIcon } from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedPageStackClass,
  sharedReminderSurfaceClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { maskPhoneInput, stripPhoneMask } from '@/shared/lib/phone';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetProfessional } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<PetProfessional> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type TeamSnapshotCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'warning';
};

function TeamSnapshotCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default'
}: TeamSnapshotCardProps) {
  const toneClass = tone === 'accent'
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] text-white shadow-[0_20px_40px_-28px_rgba(16,185,129,0.5)]'
    : tone === 'warning'
      ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(255,255,255,0.98))]'
      : 'border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.99)_140px)]';

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone === 'accent' ? 'text-white/80' : 'text-slate-700'}`}>
            {label}
          </p>
          <p className={`mt-3 text-3xl font-bold tracking-[-0.03em] ${tone === 'accent' ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tone === 'accent'
              ? 'bg-white/12 text-white'
              : tone === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 ${tone === 'accent' ? 'text-sm leading-6 text-white/80' : sharedCompactTextClass}`}>{detail}</p>
    </div>
  );
}

export function PetProfessionalsPage() {
  const { locale } = useAppI18n();
  const appMessages = useAppMessages();
  const messages = appMessages.petProfessionals;
  const commonButtons = appMessages.common.buttons;
  const [pageData, setPageData] = useState<PageResponse<PetProfessional>>(initialPage);
  const [monthlyAppointments, setMonthlyAppointments] = useState<Record<string, { count: number; total: number }>>({});
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProfessional | null>(null);

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listProfessionals(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.loadError);
    } finally {
      setLoading(false);
    }
  }, [messages.feedback.loadError]);

  useEffect(() => {
    void load(0, search);
  }, [load, search]);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    setSummaryLoading(true);

    petService.listAppointments(0, 200, '', {
      status: 'COMPLETED',
      scheduledFrom: start,
      scheduledTo: end
    }).then((result) => {
      if (!active) {
        return;
      }

      const grouped = resolvePageItems(result).reduce<Record<string, { count: number; total: number }>>((accumulator, appointment) => {
        const current = accumulator[appointment.professionalId] ?? { count: 0, total: 0 };
        current.count += 1;
        current.total += appointment.commissionAmount ?? 0;
        accumulator[appointment.professionalId] = current;
        return accumulator;
      }, {});

      setMonthlyAppointments(grouped);
    }).catch(() => {
      if (active) {
        setMonthlyAppointments({});
      }
    }).finally(() => {
      if (active) {
        setSummaryLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setSpecialty('');
    setLicenseNumber('');
    setPhone('');
    setEmail('');
    setCommissionRate('');
  }

  function beginEdit(item: PetProfessional) {
    setEditingId(item.id);
    setName(item.name);
    setSpecialty(item.specialty ?? '');
    setLicenseNumber(item.licenseNumber ?? '');
    setPhone(item.phone ? maskPhoneInput(item.phone) : '');
    setEmail(item.email ?? '');
    setCommissionRate(item.commissionRate != null ? String(item.commissionRate * 100) : '');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const parsedRate = commissionRate ? parseFloat(commissionRate) : undefined;
      const payload = {
        name,
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        phone: stripPhoneMask(phone) || undefined,
        email: email || undefined,
        commissionRate: parsedRate && !isNaN(parsedRate) ? parsedRate / 100 : undefined
      };

      if (editingId) {
        await petService.updateProfessional(editingId, payload);
        setSuccess(messages.feedback.updated);
      } else {
        await petService.createProfessional(payload);
        setSuccess(messages.feedback.created);
      }

      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteProfessional(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(messages.feedback.removed);
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.deleteError);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const configuredCommissionCount = rows.filter((item) => item.commissionRate != null).length;
  const projectedCommissionTotal = Object.values(monthlyAppointments).reduce((total, item) => total + item.total, 0);
  const pendingCommissionSetup = rows.filter((item) => item.commissionRate == null).length;

  const columns: DataTableColumn<PetProfessional>[] = [
    {
      key: 'professional',
      header: messages.columns.professional,
      render: (item) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-700">
            {item.specialty ?? messages.columns.defaultSpecialty}
          </p>
        </div>
      )
    },
    {
      key: 'contact',
      header: messages.columns.contact,
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm text-slate-900">{item.email ?? messages.columns.noEmail}</p>
          <p className="text-xs text-slate-700">{item.phone ?? messages.columns.noPhone}</p>
        </div>
      )
    },
    {
      key: 'commission',
      header: messages.columns.commission,
      render: (item) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {item.commissionRate != null
              ? `${(item.commissionRate * 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
              : '—'}
          </p>
          <p className="text-xs text-slate-700">
            {monthlyAppointments[item.id]
              ? `${monthlyAppointments[item.id].count} · ${formatCurrencyForLocale(locale, monthlyAppointments[item.id].total)}`
              : messages.columns.noCompletedServices}
          </p>
          <p className="text-xs text-slate-700">
            {item.commissionRate != null
              ? messages.columns.ruleVisible
              : messages.columns.defineRate}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: messages.columns.status,
      render: (item) => {
        const monthlySummary = monthlyAppointments[item.id];
        const status = item.commissionRate == null ? 'warn' : monthlySummary ? 'active' : 'neutral';

        return (
          <div className="space-y-2">
            <StatusBadge status={status} />
            <p className="text-xs text-slate-700">
              {item.commissionRate == null
                ? messages.columns.needsSetup
                : monthlySummary
                  ? messages.columns.alreadyGenerating
                  : messages.columns.readyForNextVisit}
            </p>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: messages.columns.actions,
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.professional.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              {commonButtons.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.professional.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              {commonButtons.delete}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.professional.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          eyebrow={messages.eyebrow}
          title={messages.title}
          description={messages.description}
          actions={(
            <Link href="/pet/commissions" className="ui-secondary-button">
              {messages.openSummary}
            </Link>
          )}
        />

        <PageSection
          tone="muted"
          title={messages.snapshotTitle}
          description={messages.snapshotDescription}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TeamSnapshotCard
              icon={Users}
              label={messages.metrics.professionals}
              value={new Intl.NumberFormat(locale).format(totalItems)}
              detail={messages.snapshotDescription}
            />
            <TeamSnapshotCard
              icon={CalendarDays}
              label={messages.metrics.configured}
              value={new Intl.NumberFormat(locale).format(configuredCommissionCount)}
              detail={messages.columns.ruleVisible}
            />
            <TeamSnapshotCard
              icon={DollarSign}
              label={messages.metrics.projected}
              value={summaryLoading ? messages.metrics.loading : formatCurrencyForLocale(locale, projectedCommissionTotal)}
              detail={messages.columns.noCompletedServices}
              tone="accent"
            />
            <TeamSnapshotCard
              icon={Star}
              label={messages.metrics.needSetup}
              value={new Intl.NumberFormat(locale).format(pendingCommissionSetup)}
              detail={messages.columns.defineRate}
              tone={pendingCommissionSetup > 0 ? 'warning' : 'default'}
            />
          </div>
          {pendingCommissionSetup > 0 ? (
            <div className="ui-notice-warning mt-5">
              {messages.warnings.pendingSetup.replace('{count}', String(pendingCommissionSetup))}
            </div>
          ) : null}
        </PageSection>

        <div className={`grid gap-3 md:grid-cols-[1fr_auto] ${sharedFilterToolbarClass}`}>
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder={messages.search.placeholder} />
          <div className="flex items-end gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => setSearch(searchInput)}
              className="ui-primary-button"
            >
              {messages.search.apply}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
              }}
              className="ui-inline-button"
            >
              {messages.search.clear}
            </button>
          </div>
        </div>

        <PermissionGuard permission={editingId ? 'pet.professional.update' : 'pet.professional.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormInput
              id="professional-name"
              name="professionalName"
              label={messages.form.name}
              value={name}
              onChange={setName}
              autoComplete="section-professional off"
              data-lpignore="true"
              data-1p-ignore="true"
              required
            />
            <FormInput label={messages.form.specialty} value={specialty} onChange={setSpecialty} />
            <FormInput label={messages.form.licenseNumber} value={licenseNumber} onChange={setLicenseNumber} />
            <FormInput
              id="professional-phone"
              name="tel"
              label={messages.form.phone}
              value={phone}
              onChange={(v) => setPhone(maskPhoneInput(v))}
              type="tel"
              autoComplete="section-professional tel"
              inputMode="tel"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <FormInput
              id="professional-email"
              name="professionalEmail"
              label={messages.form.email}
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="section-professional email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <FormInput
              id="professional-commission-rate"
              name="professionalCommissionRate"
              label={messages.form.commissionRate}
              value={commissionRate}
              onChange={setCommissionRate}
              type="number"
              autoComplete="section-professional off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder={messages.form.commissionRatePlaceholder}
            />

            <div className={`md:col-span-2 ${sharedReminderSurfaceClass}`}>
              <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">{messages.form.reminderTitle}</p>
              <p className="mt-1 text-xs text-slate-700">
                {messages.form.reminderDescription}
              </p>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="ui-primary-button"
              >
                {submitting ? messages.form.saving : editingId ? messages.form.update : messages.form.create}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ui-secondary-button"
                >
                  {messages.form.cancel}
                </button>
              ) : null}
            </div>
          </form>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyState={{
            title: messages.table.emptyTitle,
            description: messages.table.emptyDescription,
            action: (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="ui-primary-button"
              >
                {messages.table.addFirst}
              </button>
            )
          }}
        />
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(page) => load(page, search)} />

        <ConfirmDialog
          open={deleteCandidate !== null}
          title={messages.dialog.title}
          description={deleteCandidate ? messages.dialog.description.replace('{name}', deleteCandidate.name) : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
