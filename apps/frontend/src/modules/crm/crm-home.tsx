'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import {
  ModuleWorkspaceAction,
  ModuleWorkspaceFactList,
  ModuleWorkspaceGuidance,
  ModuleWorkspaceGuidanceStep,
  ModuleWorkspaceHero,
  ModuleWorkspaceOverviewGrid,
  ModuleWorkspaceQuickActionGrid,
  ModuleWorkspaceSection,
  ModuleWorkspaceState
} from '@/shared/modules/module-workspace';
import {
  noDataCapability,
  notConfiguredCapability,
  permissionCapability,
  readyCapability
} from '@/shared/modules/module-capability';
import { resolveModuleWorkspaceVisualState } from '@/shared/modules/module-workspace-visual';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { crmService } from '@/shared/services/crm-service';
import { usePermissions } from '@/shared/auth/usePermissions';
import { CrmDashboardSummary } from '@/shared/types/crm';

type CrmPrimaryAction = {
  title: string;
  description: string;
  href: string;
};

const crmWorkspaceActions: ModuleWorkspaceAction[] = [
  {
    href: '/crm/dashboard',
    eyebrow: 'Overview',
    title: 'Open dashboard',
    description: 'Review pipeline health, conversion signals, and recent commercial activity.',
    permission: 'crm.dashboard.read',
    restrictionTitle: 'Dashboard permission required',
    restrictionDescription: 'This summary becomes available when your workspace role includes CRM dashboard access.'
  },
  {
    href: '/crm/companies',
    eyebrow: 'Records',
    title: 'Manage companies',
    description: 'Work through account records tied to contacts, leads, and active deals.',
    permission: 'crm.company.read',
    restrictionTitle: 'Company access required',
    restrictionDescription: 'Company records appear here when your workspace role can read CRM companies.'
  },
  {
    href: '/crm/contacts',
    eyebrow: 'Records',
    title: 'Review contacts',
    description: 'Inspect the people currently linked to this commercial workspace.',
    permission: 'crm.contact.read',
    restrictionTitle: 'Contact access required',
    restrictionDescription: 'Contact records stay hidden until your workspace role includes CRM contact access.'
  },
  {
    href: '/crm/leads',
    eyebrow: 'Pipeline',
    title: 'Qualify leads',
    description: 'Handle intake, source attribution, and early qualification inside this workspace.',
    permission: 'crm.lead.read',
    restrictionTitle: 'Lead access required',
    restrictionDescription: 'Lead qualification becomes available when your workspace role can read CRM leads.'
  },
  {
    href: '/crm/deals',
    eyebrow: 'Pipeline',
    title: 'Track deals',
    description: 'Follow open opportunities, commercial value, and closing expectations.',
    permission: 'crm.deal.read',
    restrictionTitle: 'Deal access required',
    restrictionDescription: 'Deal tracking appears here when your workspace role can read CRM deals.'
  },
  {
    href: '/crm/pipeline',
    eyebrow: 'Pipeline',
    title: 'Inspect stages',
    description: 'Keep stage order, defaults, and commercial flow visible for the workspace.',
    permission: 'crm.pipeline.read',
    restrictionTitle: 'Pipeline access required',
    restrictionDescription: 'Pipeline stages remain unavailable until your workspace role can read CRM pipeline stages.'
  },
  {
    href: '/crm/tasks',
    eyebrow: 'Execution',
    title: 'Handle tasks',
    description: 'Work through follow-up commitments linked to companies, leads, contacts, and deals.',
    permission: 'crm.task.read',
    restrictionTitle: 'Task access required',
    restrictionDescription: 'Task execution stays hidden until your workspace role can read CRM tasks.'
  },
  {
    href: '/crm/notes',
    eyebrow: 'Signals',
    title: 'Review notes',
    description: 'Read and capture operational context tied to the CRM records in this workspace.',
    permission: 'crm.note.read',
    restrictionTitle: 'Notes access required',
    restrictionDescription: 'Commercial notes appear here when your workspace role can read CRM notes.'
  },
  {
    href: '/crm/activity',
    eyebrow: 'Signals',
    title: 'Check activity',
    description: 'Read the recent audit trail for commercial work happening in the current workspace.',
    permission: 'crm.activity.read',
    restrictionTitle: 'Activity access required',
    restrictionDescription: 'The activity feed becomes available when your workspace role can read CRM activity.'
  }
];

function resolveCrmWorkspaceDescription(scopeName: string, workspaceLabel: string, isPlatformOwnerTenant: boolean, hasSystemAdminRole: boolean) {
  if (isPlatformOwnerTenant) {
    return 'Use this CRM workspace to inspect the product surface from the PhaifferTech platform-owner tenant without leaving the authenticated shell context.';
  }

  if (hasSystemAdminRole) {
    return `This CRM workspace is scoped to ${scopeName} while an internal support role is active in the current session.`;
  }

  return `Commercial records, follow-up, and opportunity management are scoped to ${scopeName} through the current ${workspaceLabel.toLowerCase()}.`;
}

function resolveOverviewValue(value?: number) {
  return value === undefined ? 'Loading...' : value.toString();
}

function isCrmFirstUse(summary: CrmDashboardSummary) {
  return summary.totalContacts === 0
    && summary.totalLeads === 0
    && summary.totalCompanies === 0
    && summary.totalDeals === 0
    && summary.tasksPendentes === 0;
}

function buildCrmGuidanceSteps(actions: ModuleWorkspaceAction[], keys: string[]): ModuleWorkspaceGuidanceStep[] {
  return keys
    .map((key) => actions.find((action) => action.href === key))
    .filter((action): action is ModuleWorkspaceAction => Boolean(action))
    .map((action) => {
      const capability = action.capability ?? readyCapability(action.status);

      return {
        key: action.href,
        eyebrow: action.eyebrow,
        title: action.title,
        description: capability.kind === 'ready'
          ? action.description
          : capability.description ?? action.description,
        href: capability.interactive ? action.href : undefined,
        status: capability.status ?? action.status ?? null,
        capability
      };
    });
}

function resolveActionHref(actions: ModuleWorkspaceAction[], href: string, fallbackHref: string) {
  const action = actions.find((candidate) => candidate.href === href && candidate.capability?.interactive !== false);
  return action?.href ?? fallbackHref;
}

function resolveFallbackCrmAction(actions: ModuleWorkspaceAction[]) {
  const interactiveAction = actions.find((candidate) => candidate.capability?.interactive !== false);
  if (!interactiveAction) {
    return null;
  }

  return {
    title: interactiveAction.title,
    description: interactiveAction.capability?.kind === 'ready'
      ? interactiveAction.description
      : interactiveAction.capability?.description ?? interactiveAction.description,
    href: interactiveAction.href
  } satisfies CrmPrimaryAction;
}

function findPulseCard(summary: CrmDashboardSummary | null, key: string) {
  return summary?.summaryCards.find((card) => card.key === key) ?? null;
}

function resolveCrmPrimaryAction(actions: ModuleWorkspaceAction[], summary: CrmDashboardSummary | null, firstUse: boolean) {
  const fallbackAction = resolveFallbackCrmAction(actions);

  if (!fallbackAction) {
    return null;
  }

  if (firstUse) {
    return {
      title: 'Create first company',
      description: 'Start the CRM workspace by creating the first company and unlocking contacts, leads, and deal flow.',
      href: resolveActionHref(actions, '/crm/companies', fallbackAction.href)
    } satisfies CrmPrimaryAction;
  }

  if ((summary?.overdueTasks ?? 0) > 0) {
    return {
      title: 'Review overdue tasks',
      description: `${summary?.overdueTasks ?? 0} commercial follow-up item(s) are overdue and need ownership now.`,
      href: resolveActionHref(actions, '/crm/tasks', fallbackAction.href)
    } satisfies CrmPrimaryAction;
  }

  if ((summary?.totalDeals ?? 0) > 0) {
    return {
      title: 'Open deals pipeline',
      description: `${summary?.totalDeals ?? 0} active deal(s) are still moving through the workspace pipeline.`,
      href: resolveActionHref(actions, '/crm/deals', fallbackAction.href)
    } satisfies CrmPrimaryAction;
  }

  if ((summary?.totalLeads ?? 0) > 0) {
    return {
      title: 'Qualify recent leads',
      description: `${summary?.totalLeads ?? 0} lead(s) are ready for qualification before they stall.`,
      href: resolveActionHref(actions, '/crm/leads', fallbackAction.href)
    } satisfies CrmPrimaryAction;
  }

  return {
    title: 'Open CRM dashboard',
    description: 'Review pipeline posture, active follow-up, and the latest commercial movement.',
    href: resolveActionHref(actions, '/crm/dashboard', fallbackAction.href)
  } satisfies CrmPrimaryAction;
}

export function CrmHome() {
  const platform = useFrontendPlatform();
  const { hasPermission } = usePermissions();
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('crm.dashboard.read');
  const crmVisual = useMemo(
    () => resolveModuleWorkspaceVisualState(platform, {
      moduleContext: 'crm',
      defaultProfile: 'crm-corporate'
    }),
    [platform]
  );
  const featuredSection = summary?.sections.find((section) => (
    section.cards.length > 0
    || section.metrics.length > 0
    || section.items.length > 0
    || section.timeSeries.length > 0
  )) ?? null;
  const firstUse = summary ? isCrmFirstUse(summary) : false;
  const actionStates = crmWorkspaceActions
    .map((action) => {
      const allowed = !action.permission || hasPermission(action.permission);
      const capability = allowed
        ? readyCapability(action.status)
        : permissionCapability({
            title: action.restrictionTitle ?? 'Permission required',
            description: action.restrictionDescription ?? action.description
          });

      return {
        ...action,
        available: capability.interactive,
        status: capability.status ?? action.status ?? null,
        capability
      };
    })
    .map((action) => {
      if (action.capability?.kind !== 'ready' || !summary) {
        return action;
      }

      if (firstUse && action.href === '/crm/deals') {
        const capability = notConfiguredCapability({
          title: 'Deal flow not configured yet',
          description: 'Create the first companies, contacts, and leads before active deals appear in this CRM workspace.'
        });

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/crm/activity') {
        const capability = notConfiguredCapability({
          title: 'Activity feed not configured yet',
          description: 'Commercial activity appears after the first CRM records and follow-up tasks are created.'
        });

        return { ...action, capability, status: capability.status };
      }

      if (!firstUse && !featuredSection && action.href === '/crm/activity') {
        const capability = noDataCapability({
          title: 'No recent CRM activity yet',
          description: 'The workspace has CRM records, but no compact recent-activity feed is available right now.'
        });

        return { ...action, capability, status: capability.status };
      }

      return action;
    });
  const fallbackGuidance = buildCrmGuidanceSteps(actionStates, ['/crm/companies', '/crm/contacts', '/crm/leads']);
  const restrictedGuidance = buildCrmGuidanceSteps(actionStates, ['/crm/companies', '/crm/leads', '/crm/tasks']);
  const landingActions = useMemo(
    () => actionStates.filter((action) => ['/crm/companies', '/crm/leads', '/crm/deals'].includes(action.href)),
    [actionStates]
  );
  const primaryAction = useMemo(
    () => resolveCrmPrimaryAction(actionStates, summary, firstUse),
    [actionStates, firstUse, summary]
  );
  const pulseCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return ['pipeline-value', 'active-deals', 'overdue-tasks', 'pending-tasks']
      .map((key) => findPulseCard(summary, key))
      .filter((card): card is NonNullable<ReturnType<typeof findPulseCard>> => Boolean(card));
  }, [summary]);

  useEffect(() => {
    let active = true;

    if (!canReadDashboard) {
      setSummary(null);
      setError(null);
      setLoadingSummary(false);
      return () => {
        active = false;
      };
    }

    setLoadingSummary(true);

    crmService
      .getDashboardSummary()
      .then((result) => {
        if (!active) {
          return;
        }

        setSummary(result);
        setError(null);
        setLoadingSummary(false);
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setSummary(null);
        setError(err instanceof ApiClientError ? err.message : 'Unable to load the CRM workspace summary.');
        setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [canReadDashboard]);

  return (
    <div
      className="space-y-6"
      style={crmVisual.style}
      data-crm-profile={crmVisual.visualProfile.key}
    >
      <ModuleWorkspaceHero
        eyebrow="CRM Workspace"
        title={`${platform.branding.scopeName} · CRM`}
        description={resolveCrmWorkspaceDescription(
          platform.branding.scopeName,
          platform.workspace.workspaceLabel,
          platform.workspace.isPlatformOwnerTenant,
          platform.workspace.hasSystemAdminRole
        )}
        action={primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--tenant-accent)] transition hover:-translate-y-0.5"
          >
            {primaryAction.title}
          </Link>
        ) : null}
        chips={[
          { label: 'Workspace', value: platform.workspace.workspaceLabel },
          { label: 'Access', value: platform.workspace.accessLabel, tone: 'neutral' }
        ]}
        aside={(
          <ModuleWorkspaceFactList
            facts={[
              {
                label: 'Workspace code',
                value: platform.branding.tenantCode ?? 'Not assigned',
                description: 'Stable workspace identifier for CRM.'
              },
              {
                label: 'Next action',
                value: primaryAction?.title ?? 'Open CRM workspace',
                description: primaryAction?.description ?? 'Use the workspace actions below to continue.',
                status: summary?.overdueTasks ? 'alert' : firstUse ? 'setup required' : 'active'
              }
            ]}
          />
        )}
      />

      <ModuleWorkspaceOverviewGrid
        cards={[
          {
            label: 'Workspace scope',
            value: platform.branding.scopeName,
            description: 'Commercial records remain anchored to the active workspace.'
          },
          {
            label: 'Total contacts',
            value: canReadDashboard ? resolveOverviewValue(summary?.totalContacts) : '--',
            description: 'Contacts currently tracked inside this CRM workspace.',
            status: !canReadDashboard ? 'no permission' : summary && firstUse ? 'setup required' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Dashboard visibility required',
                  description: 'Grant `crm.dashboard.read` to surface CRM contact totals on this workspace landing page.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Contact base not configured yet',
                    description: 'Add the first companies and contacts so this CRM workspace can start surfacing commercial volume.'
                  })
                : undefined
          },
          {
            label: 'Pipeline load',
            value: canReadDashboard ? (summary ? `${summary.totalLeads} leads / ${summary.totalDeals} deals` : 'Loading...') : '--',
            description: 'Lead intake and active deal flow visible in the current workspace.',
            status: !canReadDashboard ? 'no permission' : summary && firstUse ? 'setup required' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Pipeline metrics require dashboard access',
                  description: 'Grant `crm.dashboard.read` to surface lead and deal volume on this workspace overview.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Pipeline not configured yet',
                    description: 'Lead and deal flow start after the first commercial records are created in this workspace.'
                  })
                : undefined
          },
          {
            label: 'Follow-up attention',
            value: canReadDashboard
              ? summary
                ? `${summary.overdueTasks} overdue / ${summary.tasksPendentes} open`
                : 'Loading...'
              : '--',
            description: 'Keep open and overdue commitments visible before they disappear behind record volume.',
            status: !canReadDashboard
              ? 'no permission'
              : summary && firstUse
                ? 'setup required'
                : summary && summary.overdueTasks > 0
                  ? 'alert'
                  : summary && summary.tasksPendentes > 0
                    ? 'pending'
                  : summary
                    ? 'active'
                    : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Follow-up visibility requires dashboard access',
                  description: 'Grant `crm.dashboard.read` to surface pending CRM tasks from this landing page.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Follow-up queue not configured yet',
                    description: 'CRM tasks appear after the first companies, contacts, leads, and deals create operational follow-up.'
                  })
                : undefined
          }
        ]}
      />

      <ModuleWorkspaceQuickActionGrid
        title="Core CRM flows"
        description="Keep the visible CRM surface focused on records, lead intake, and live deals."
        actions={landingActions}
        emptyTitle="No CRM actions available"
        emptyDescription="This workspace has the CRM module enabled, but the current user does not have CRM read permissions yet."
      />

      <ModuleWorkspaceSection
        title="Commercial Pulse"
        description="Keep a compact operational slice visible before navigating into the deeper CRM dashboards and record lists."
        action={primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]"
          >
            {primaryAction.title}
          </Link>
        ) : null}
      >
        {!canReadDashboard ? (
          <div className="space-y-4">
            <ModuleWorkspaceState
              tone="neutral"
              title="Dashboard summary restricted"
              description="This CRM workspace is available, but the commercial pulse requires `crm.dashboard.read`. Continue through the permitted record and execution flows below."
            />
            <ModuleWorkspaceGuidance
              title="Continue with the CRM workspace"
              description="These next steps stay available even while dashboard visibility is restricted."
              steps={restrictedGuidance}
            />
          </div>
        ) : loadingSummary ? (
          <ModuleWorkspaceState
            tone="neutral"
            title="Loading CRM summary"
            description="Collecting the latest commercial overview for this workspace."
          />
        ) : error ? (
          <div className="space-y-4">
            <ModuleWorkspaceState tone="error" title="CRM summary unavailable" description={error} />
            <ModuleWorkspaceGuidance
              title="Keep the workspace moving"
              description="Use the permitted CRM flows below while the summary feed recovers."
              steps={restrictedGuidance}
            />
          </div>
        ) : summary && firstUse ? (
          <GettingStartedChecklist
            eyebrow="CRM Onboarding"
            title="Set up the CRM workspace"
            description="This workspace does not have the first CRM records in place yet. Work through the checklist below to establish companies, contacts, and the first pipeline signals."
            steps={fallbackGuidance}
          />
        ) : summary ? (
          <div className="space-y-4">
            <MetricGrid cards={pulseCards} columns="md:grid-cols-2 xl:grid-cols-4" />
            {featuredSection ? (
              <DashboardSection section={featuredSection} />
            ) : (
              <div className="space-y-4">
                <ModuleWorkspaceState
                  tone="neutral"
                  title="No recent CRM activity yet"
                  description="The workspace already has CRM records, but the summary returned no compact recent-activity block right now."
                />
                <ModuleWorkspaceGuidance
                  title="Keep working the CRM workspace"
                  description="Continue through the core CRM flows below while the next activity signal is still building."
                  steps={restrictedGuidance}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyStateCard
            title="No CRM summary available"
            description="No CRM dashboard data was returned for the current workspace."
            actionLabel={primaryAction?.title}
            href={primaryAction?.href}
          />
        )}
      </ModuleWorkspaceSection>
    </div>
  );
}
