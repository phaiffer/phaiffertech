'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { ClientPlan, PetClient } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 20;

const initialPage: PageResponse<ClientPlan> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

// Returns a toneMap-compatible status key for StatusBadge
function resolvePlanStatusKey(plan: ClientPlan): string {
  if (plan.remainingSessions <= 0) return 'canceled'; // exhausted → destructive tone
  if (plan.expiresAt && new Date(plan.expiresAt) < new Date()) return 'error'; // expired → destructive tone
  if (plan.remainingSessions <= 2) return 'warn'; // low sessions → warning tone
  return 'active'; // healthy
}

function formatExpiryLabel(locale: string, value: string | null | undefined, noExpiryLabel: string) {
  if (!value) {
    return noExpiryLabel;
  }

  return formatDateForLocale(locale as 'pt-BR' | 'en-US', value);
}

export function PetPlansPage() {
  const { locale } = useAppI18n();
  const appMessages = useAppMessages();
  const messages = appMessages.petPlans;
  const appointmentMessages = appMessages.petAppointments;
  const commonButtons = appMessages.common.buttons;
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<ClientPlan>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [planName, setPlanName] = useState('');
  const [totalSessions, setTotalSessions] = useState('10');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<ClientPlan | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canManagePlan = hasPermission('pet.plan.create');

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: messages.filters.allClients },
      ...clients.map((c) => ({ value: c.id, label: c.name ?? c.fullName ?? c.id }))
    ];
  }, [clients, messages.filters.allClients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: messages.filters.selectClient },
      ...clients.map((c) => ({ value: c.id, label: c.name ?? c.fullName ?? c.id }))
    ];
  }, [clients, messages.filters.selectClient]);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listClientPlans(undefined, page, pageSize);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.loadingDescription);
    } finally {
      setLoading(false);
    }
  }, [messages.loadingDescription]);

  useEffect(() => {
    void load(0);
  }, [load]);

  useEffect(() => {
    if (!canReadClients) return;
    petService.listClients(0, 200, '').then((result) => {
      setClients(resolvePageItems(result));
    }).catch(() => {
      // Non-critical — client names will fall back to IDs
    });
  }, [canReadClients]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setPlanName('');
    setTotalSessions('10');
    setExpiresAt('');
  }

  function beginEdit(plan: ClientPlan) {
    setEditingId(plan.id);
    setClientId(plan.clientId);
    setPlanName(plan.planName);
    setTotalSessions(String(plan.totalSessions));
    setExpiresAt(plan.expiresAt ? plan.expiresAt.substring(0, 10) : '');
    setError(null);
    setSuccess(null);
    document.getElementById('pet-plan-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId && !clientId) {
      setError(messages.validation.selectClient);
      return;
    }

    const parsed = parseInt(totalSessions, 10);
    if (isNaN(parsed) || parsed < 1) {
      setError(messages.validation.positiveSessions);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await petService.updateClientPlan(editingId, {
          planName,
          totalSessions: parsed,
          expiresAt: expiresAt || undefined
        });
        setSuccess(messages.form.update);
      } else {
        await petService.createClientPlan({
          clientId,
          planName,
          totalSessions: parsed,
          expiresAt: expiresAt || undefined
        });
        setSuccess(messages.form.create);
      }
      resetForm();
      await load(0);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    try {
      await petService.deleteClientPlan(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(messages.dialog.confirm);
      await load(0);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.feedback.removeError);
    }
  }

  function resolveClientName(plan: ClientPlan) {
    const client = clients.find((c) => c.id === plan.clientId);
    return client ? (client.name ?? client.fullName ?? plan.clientId) : plan.clientId;
  }

  function resolveClientEmail(plan: ClientPlan) {
    const client = clients.find((c) => c.id === plan.clientId);
    return client?.email ?? null;
  }

  const rows = resolvePageItems(pageData);
  const activePlans = rows.filter((plan) => resolvePlanStatusKey(plan) === 'active').length;
  const lowSessionPlans = rows.filter((plan) => plan.remainingSessions > 0 && plan.remainingSessions <= 2).length;
  const exhaustedPlans = rows.filter((plan) => plan.remainingSessions <= 0).length;
  const penultimatePlans = rows.filter((plan) => plan.remainingSessions === 2).length;
  const renewalEmailMissingCount = rows.filter((plan) => plan.remainingSessions === 2 && !resolveClientEmail(plan)).length;

  const columns: DataTableColumn<ClientPlan>[] = [
    {
      key: 'client',
      header: messages.form.client,
      render: (plan) => (
        <div className="space-y-1">
          <p className="font-medium text-[color:var(--app-shell-heading)]">{resolveClientName(plan)}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {resolveClientEmail(plan) ?? messages.columns.noRenewalEmail}
          </p>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            {appointmentMessages.columns.recurring}
          </span>
        </div>
      )
    },
    {
      key: 'planName',
      header: messages.form.planName,
      render: (plan) => (
        <div className="space-y-1">
          <span className="font-medium">{plan.planName}</span>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {plan.remainingSessions > 0 ? messages.columns.activeLinked : messages.columns.noSessionsLeft}
          </p>
        </div>
      )
    },
    {
      key: 'sessions',
      header: messages.form.totalSessions,
      render: (plan) => {
        const statusKey = resolvePlanStatusKey(plan);
        const isProblematic = statusKey === 'canceled' || statusKey === 'error';
        const isLow = statusKey === 'warn';
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${isProblematic ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                {plan.remainingSessions} {appointmentMessages.columns.leftSuffix}
              </span>
              <span className="text-xs text-[color:var(--app-shell-muted)]">/ {plan.totalSessions}</span>
            </div>
            <div className="text-xs text-[color:var(--app-shell-muted)]">{plan.usedSessions} {messages.columns.used}</div>
            {plan.remainingSessions === 2 ? (
              <div className="text-xs text-amber-700">{messages.columns.penultimateAlert}</div>
            ) : null}
            {plan.remainingSessions === 1 ? (
              <div className="text-xs text-amber-700">{messages.columns.finalSession}</div>
            ) : null}
            {plan.remainingSessions <= 0 ? (
              <div className="text-xs text-red-700">{messages.columns.renewBeforeNextVisit}</div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: messages.columns.status,
      render: (plan) => (
        <div className="space-y-2">
          <StatusBadge status={resolvePlanStatusKey(plan)} />
          {plan.remainingSessions === 2 ? (
            <p className="text-xs text-[color:var(--app-shell-muted)]">
              {resolveClientEmail(plan) ? messages.columns.renewalSent : messages.columns.renewalNeedsEmail}
            </p>
          ) : plan.remainingSessions === 1 ? (
            <p className="text-xs text-[color:var(--app-shell-muted)]">
              Next completed visit will finish the current plan.
            </p>
          ) : plan.remainingSessions > 2 ? (
            <p className="text-xs text-[color:var(--app-shell-muted)]">
              Plan is active and still supports the recurring cycle.
            </p>
          ) : null}
        </div>
      )
    },
    {
      key: 'expiry',
      header: messages.form.expiresOn,
      render: (plan) => (
        <div className="space-y-1">
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {formatExpiryLabel(locale, plan.expiresAt, messages.filters.noExpiry)}
          </p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {plan.expiresAt ? messages.columns.expiryAlign : messages.columns.sessionTrigger}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: messages.columns.actions,
      render: (plan) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.plan.create">
            <button type="button" onClick={() => beginEdit(plan)} className="ui-inline-button">
              {commonButtons.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.plan.create">
            <button type="button" onClick={() => setDeleteCandidate(plan)} className="ui-inline-danger-button">
              {commonButtons.remove}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.plan.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          eyebrow={messages.eyebrow}
          title={messages.title}
          description={messages.description}
          actions={canManagePlan ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                document.getElementById('pet-plan-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="ui-primary-button"
            >
              {messages.createPlan}
            </button>
          ) : undefined}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          tone="muted"
          title={messages.watchTitle}
          description={messages.watchDescription}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.activePlans}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{activePlans}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.activePlansDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.renewSoon}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{lowSessionPlans}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.renewSoonDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.penultimateBath}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{penultimatePlans}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.penultimateBathDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.renewalEmailMissing}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{renewalEmailMissingCount}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.renewalEmailMissingDetail}</p>
            </div>
          </div>
          {exhaustedPlans > 0 ? (
            <div className="ui-notice-warning mt-5">
              {exhaustedPlans} {messages.exhaustedWarning}
            </div>
          ) : null}
        </PageSection>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          loadingTitle={messages.loadingTitle}
          loadingDescription={messages.loadingDescription}
          emptyState={{
            title: messages.emptyTitle,
            description: messages.emptyDescription,
            action: canManagePlan ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  document.getElementById('pet-plan-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="ui-primary-button"
              >
                {messages.firstPlan}
              </button>
            ) : undefined
          }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={resolveTotalItems(pageData)}
          onPageChange={(nextPage) => load(nextPage)}
        />

        <div id="pet-plan-form-section">
          <PermissionGuard permission="pet.plan.create">
            <form onSubmit={handleSubmit} className="ui-surface-panel p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {editingId ? messages.form.editTitle : messages.form.createTitle}
                </h3>
                <p className="text-xs text-[color:var(--app-shell-muted)] mt-0.5">
                  {editingId
                    ? messages.form.editDescription
                    : messages.form.createDescription}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <FormSelect
                  label={messages.form.client}
                  value={clientId}
                  options={formClientOptions}
                  onChange={setClientId}
                  disabled={!!editingId || !canReadClients}
                />
                <FormInput
                  label={messages.form.planName}
                  value={planName}
                  onChange={setPlanName}
                  placeholder={messages.columns.planNamePlaceholder}
                  required
                />
                <FormInput
                  label={messages.form.totalSessions}
                  value={totalSessions}
                  onChange={setTotalSessions}
                  type="number"
                  placeholder="10"
                  required
                />
                <FormInput
                  label={messages.form.expiresOn}
                  value={expiresAt}
                  onChange={setExpiresAt}
                  type="date"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="ui-primary-button">
                  {submitting ? messages.form.save : editingId ? messages.form.update : messages.form.create}
                </button>
                {editingId ? (
                  <button type="button" onClick={resetForm} className="ui-secondary-button">
                    {messages.form.cancel}
                  </button>
                ) : null}
              </div>
            </form>
          </PermissionGuard>
        </div>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={messages.dialog.title}
          description={deleteCandidate ? messages.dialog.description.replace('{name}', deleteCandidate.planName) : undefined}
          confirmLabel={messages.dialog.confirm}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
