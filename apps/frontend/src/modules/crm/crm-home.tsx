'use client';

import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
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
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { crmService } from '@/shared/services/crm-service';
import { usePermissions } from '@/shared/auth/usePermissions';
import { CrmDashboardSummary } from '@/shared/types/crm';

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
    description: 'Inspect the people currently linked to the tenant commercial workspace.',
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
    description: 'Keep stage order, defaults, and commercial flow visible for the tenant.',
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
    description: 'Read the recent audit trail for commercial work happening in the current tenant.',
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
    return `This CRM workspace remains tenant-scoped to ${scopeName} while an internal support role is active in the current session.`;
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

export function CrmHome() {
  const platform = useFrontendPlatform();
  const { hasPermission } = usePermissions();
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('crm.dashboard.read');
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
  const themePolicy = platform.theme.canOverride
    ? `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} with user override`
    : `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} tenant-managed`;
  const fallbackGuidance = buildCrmGuidanceSteps(actionStates, ['/crm/companies', '/crm/contacts', '/crm/leads']);
  const restrictedGuidance = buildCrmGuidanceSteps(actionStates, ['/crm/companies', '/crm/tasks', '/crm/notes']);

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
    <div className="space-y-6">
      <ModuleWorkspaceHero
        eyebrow="CRM Workspace"
        title={`${platform.branding.scopeName} · CRM`}
        description={resolveCrmWorkspaceDescription(
          platform.branding.scopeName,
          platform.workspace.workspaceLabel,
          platform.workspace.isPlatformOwnerTenant,
          platform.workspace.hasSystemAdminRole
        )}
        chips={[
          { label: 'Workspace', value: platform.workspace.workspaceLabel },
          { label: 'Access', value: platform.workspace.accessLabel, tone: 'neutral' },
          { label: 'Theme', value: themePolicy, tone: 'neutral' }
        ]}
        aside={(
          <ModuleWorkspaceFactList
            facts={[
              {
                label: 'Tenant code',
                value: platform.branding.tenantCode ?? 'Not assigned',
                description: 'Stable tenant identifier for this CRM workspace.'
              },
              {
                label: 'Role context',
                value: platform.user?.role ?? 'Unknown role',
                description: platform.user?.fullName
                  ? `Authenticated as ${platform.user.fullName}.`
                  : 'Authenticated user details are not available.'
              },
              {
                label: 'Module surface',
                value: 'Contracted CRM workspace',
                description: 'Only tenant-contracted CRM routes remain exposed from this landing page.',
                status: 'active'
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
            description: 'Commercial records remain anchored to the active tenant workspace.'
          },
          {
            label: 'Total contacts',
            value: canReadDashboard ? resolveOverviewValue(summary?.totalContacts) : '--',
            description: 'Contacts currently tracked inside this CRM tenant surface.',
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
                    description: 'Lead and deal flow start after the first commercial records are created in this tenant workspace.'
                  })
                : undefined
          },
          {
            label: 'Pending follow-up',
            value: canReadDashboard ? resolveOverviewValue(summary?.tasksPendentes) : '--',
            description: 'Tasks still waiting for execution in the commercial workflow.',
            status: !canReadDashboard
              ? 'no permission'
              : summary && firstUse
                ? 'setup required'
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
        title="Workspace Actions"
        description="Open the CRM surfaces permitted in the current role and keep restricted flows explicit when access boundaries apply."
        actions={actionStates}
        emptyTitle="No CRM actions available"
        emptyDescription="This tenant has the CRM module enabled, but the current user does not have CRM read permissions yet."
      />

      <ModuleWorkspaceSection
        title="Commercial Pulse"
        description="Keep a compact operational slice visible before navigating into the deeper CRM dashboards and record lists."
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
            description="Collecting the latest commercial overview for this tenant workspace."
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
          <div className="space-y-4">
            <ModuleWorkspaceState
              tone="neutral"
              title="CRM workspace not configured yet"
              description="This tenant does not have the first CRM records in place yet. Start with companies, contacts, and leads so the commercial pulse can begin surfacing real activity."
            />
            <ModuleWorkspaceGuidance
              title="Set up the CRM workspace"
              description="These guided steps establish the first commercial entities without leaving the tenant workspace context."
              steps={fallbackGuidance}
            />
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <MetricGrid cards={summary.summaryCards.slice(0, 4)} columns="md:grid-cols-2 xl:grid-cols-4" />
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
            description="No CRM dashboard data was returned for the current tenant workspace."
          />
        )}
      </ModuleWorkspaceSection>
    </div>
  );
}
