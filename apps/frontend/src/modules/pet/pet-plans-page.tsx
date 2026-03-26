'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
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

export function PetPlansPage() {
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
      { value: '', label: 'All clients' },
      ...clients.map((c) => ({ value: c.id, label: c.name ?? c.fullName ?? c.id }))
    ];
  }, [clients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a client' },
      ...clients.map((c) => ({ value: c.id, label: c.name ?? c.fullName ?? c.id }))
    ];
  }, [clients]);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listClientPlans(undefined, page, pageSize);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load client plans.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      setError('Select a client to create the plan for.');
      return;
    }

    const parsed = parseInt(totalSessions, 10);
    if (isNaN(parsed) || parsed < 1) {
      setError('Total sessions must be a positive number.');
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
        setSuccess('Plan updated.');
      } else {
        await petService.createClientPlan({
          clientId,
          planName,
          totalSessions: parsed,
          expiresAt: expiresAt || undefined
        });
        setSuccess('Plan created.');
      }
      resetForm();
      await load(0);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save plan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    try {
      await petService.deleteClientPlan(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Plan removed.');
      await load(0);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to remove plan.');
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

  const columns: DataTableColumn<ClientPlan>[] = [
    {
      key: 'client',
      header: 'Client',
      render: (plan) => (
        <div className="space-y-1">
          <p className="font-medium text-[color:var(--app-shell-heading)]">{resolveClientName(plan)}</p>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            Recurring client
          </span>
        </div>
      )
    },
    {
      key: 'planName',
      header: 'Plan',
      render: (plan) => <span className="font-medium">{plan.planName}</span>
    },
    {
      key: 'sessions',
      header: 'Sessions',
      render: (plan) => {
        const statusKey = resolvePlanStatusKey(plan);
        const isProblematic = statusKey === 'canceled' || statusKey === 'error';
        const isLow = statusKey === 'warn';
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${isProblematic ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                {plan.remainingSessions} left
              </span>
              <span className="text-xs text-[color:var(--app-shell-muted)]">/ {plan.totalSessions}</span>
            </div>
            <div className="text-xs text-[color:var(--app-shell-muted)]">{plan.usedSessions} used</div>
            {plan.remainingSessions === 2 ? (
              <div className="text-xs text-amber-700">Penultimate visit alert</div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (plan) => (
        <div className="space-y-2">
          <StatusBadge status={resolvePlanStatusKey(plan)} />
          {plan.remainingSessions === 2 ? (
            <p className="text-xs text-[color:var(--app-shell-muted)]">
              {resolveClientEmail(plan) ? 'Renewal email sent automatically' : 'Renewal email needs client email'}
            </p>
          ) : null}
        </div>
      )
    },
    {
      key: 'expiry',
      header: 'Expires',
      render: (plan) => plan.expiresAt
        ? new Date(plan.expiresAt).toLocaleDateString()
        : <span className="text-xs text-[color:var(--app-shell-muted)]">No expiry</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (plan) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.plan.create">
            <button type="button" onClick={() => beginEdit(plan)} className="ui-inline-button">
              Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.plan.create">
            <button type="button" onClick={() => setDeleteCandidate(plan)} className="ui-inline-danger-button">
              Remove
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.plan.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view client plans.</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          eyebrow="PetFlow · Grooming"
          title="Monthly Plans"
          description="Manage recurring clients, remaining visits, penultimate alerts, and plan usage across grooming appointments."
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          tone="muted"
          title="Renewal watch"
          description="Keep the recurring base visible before the plan runs out or the client misses the next cycle."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Active plans</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{activePlans}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Need renewal soon</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{lowSessionPlans}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">Exhausted</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{exhaustedPlans}</p>
            </div>
          </div>
        </PageSection>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          loadingTitle="Loading client plans"
          loadingDescription="Fetching session packages for this workspace."
          emptyState={{
            title: 'No client plans yet',
            description: 'Create a session package after a client purchases a grooming plan — e.g. "10 bath & trim sessions". Use the form below to get started.',
            action: canManagePlan ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  document.getElementById('pet-plan-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="ui-primary-button"
              >
                Create first plan
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
                  {editingId ? 'Edit plan' : 'Create new plan'}
                </h3>
                <p className="text-xs text-[color:var(--app-shell-muted)] mt-0.5">
                  {editingId
                    ? 'Update the plan name, session count, or expiry date.'
                    : 'Link a session package to a client. Example: "10 banho e tosa sessions" valid for 6 months.'}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <FormSelect
                  label="Client"
                  value={clientId}
                  options={formClientOptions}
                  onChange={setClientId}
                  disabled={!!editingId || !canReadClients}
                />
                <FormInput
                  label="Plan name"
                  value={planName}
                  onChange={setPlanName}
                  placeholder="e.g. 10 banho e tosa"
                  required
                />
                <FormInput
                  label="Total sessions"
                  value={totalSessions}
                  onChange={setTotalSessions}
                  type="number"
                  placeholder="10"
                  required
                />
                <FormInput
                  label="Expires on (optional)"
                  value={expiresAt}
                  onChange={setExpiresAt}
                  type="date"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="ui-primary-button">
                  {submitting ? 'Saving...' : editingId ? 'Update plan' : 'Create plan'}
                </button>
                {editingId ? (
                  <button type="button" onClick={resetForm} className="ui-secondary-button">
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </PermissionGuard>
        </div>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Remove this plan?"
          description={deleteCandidate ? `"${deleteCandidate.planName}" will be removed. This cannot be undone.` : undefined}
          confirmLabel="Remove"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
