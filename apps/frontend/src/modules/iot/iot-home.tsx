'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlarmIcon,
  Chip,
  DashboardIcon,
  DeviceIcon,
  FactoryIcon,
  IotActionButton,
  IotEmptyState,
  IotHeroAside,
  IotMetricCard,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotStatusPill,
  PlugIcon,
  WaveIcon
} from '@/modules/iot/iot-chrome';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
import {
  isCapabilityReady,
  noDataCapability,
  notConfiguredCapability,
  permissionCapability,
  readyCapability,
  type ModuleCapability
} from '@/shared/modules/module-capability';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import type { ModuleWorkspaceAction } from '@/shared/modules/module-workspace';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { iotService } from '@/shared/services/iot-service';
import { IotDashboardSummary } from '@/shared/types/iot';

const iotWorkspaceActions: ModuleWorkspaceAction[] = [
  {
    href: '/iot/dashboard',
    eyebrow: 'Overview',
    title: 'Open dashboard',
    description: 'Review availability, alarm pressure, telemetry rhythm, and maintenance backlog.',
    permission: 'iot.dashboard.read',
    restrictionTitle: 'Dashboard access required',
    restrictionDescription: 'The operational pulse becomes available when your workspace role includes IoT dashboard access.'
  },
  {
    href: '/iot/devices',
    eyebrow: 'Fleet',
    title: 'Inspect devices',
    description: 'Open the connected asset inventory with communication and operational context.',
    permission: 'iot.device.read',
    restrictionTitle: 'Device access required',
    restrictionDescription: 'Fleet visibility appears here when your workspace role can read IoT devices.'
  },
  {
    href: '/iot/add-device',
    eyebrow: 'Onboarding',
    title: 'Register device',
    description: 'Launch the guided Modbus onboarding flow for a new asset.',
    permission: 'iot.device.create',
    restrictionTitle: 'Device creation required',
    restrictionDescription: 'Guided onboarding becomes available when your workspace role can create IoT devices.'
  },
  {
    href: '/iot/registers',
    eyebrow: 'Mapping',
    title: 'Review registers',
    description: 'Inspect Modbus functions, addresses, data types, and thresholds.',
    permission: 'iot.register.read',
    restrictionTitle: 'Register access required',
    restrictionDescription: 'Register mapping appears here when your workspace role can read IoT registers.'
  },
  {
    href: '/iot/telemetry',
    eyebrow: 'Stream',
    title: 'Open telemetry',
    description: 'Follow live records tied to devices, registers, and collection quality.',
    permission: 'iot.telemetry.read',
    restrictionTitle: 'Telemetry access required',
    restrictionDescription: 'Live telemetry becomes available when your workspace role can read IoT telemetry.'
  },
  {
    href: '/iot/alarms',
    eyebrow: 'Incidents',
    title: 'Review alarms',
    description: 'Handle severity, acknowledgement flow, and active operational incidents.',
    permission: 'iot.alarm.read',
    restrictionTitle: 'Alarm access required',
    restrictionDescription: 'Incident review appears here when your workspace role can read IoT alarms.'
  },
  {
    href: '/iot/maintenance',
    eyebrow: 'Field work',
    title: 'Track maintenance',
    description: 'Review the intervention backlog tied to assets and alarm context.',
    permission: 'iot.maintenance.read',
    restrictionTitle: 'Maintenance access required',
    restrictionDescription: 'Field intervention flow becomes available when your workspace role can read IoT maintenance.'
  },
  {
    href: '/iot/reports',
    eyebrow: 'Reporting',
    title: 'Open reports',
    description: 'Inspect the current operational summary exported by the IoT workspace.',
    permission: 'iot.report.read',
    restrictionTitle: 'Reporting access required',
    restrictionDescription: 'Operational reports appear here when your workspace role can read IoT reports.'
  },
  {
    href: '/iot/observability',
    eyebrow: 'Observability',
    title: 'Review observability',
    description: 'Cross-check dashboard signals with telemetry, incidents, and maintenance flows.',
    permission: 'iot.report.read',
    restrictionTitle: 'Reporting access required',
    restrictionDescription: 'Observability surfaces stay hidden until your workspace role can read IoT reports.'
  }
];

function resolveIotWorkspaceDescription(scopeName: string, workspaceLabel: string, isPlatformOwnerTenant: boolean, hasSystemAdminRole: boolean) {
  if (isPlatformOwnerTenant) {
    return 'Use this connected-operations workspace to inspect the IoT product surface from the PhaifferTech platform-owner tenant.';
  }

  if (hasSystemAdminRole) {
    return `This IoT workspace stays tenant-scoped to ${scopeName} while an internal support role is active in the current session.`;
  }

  return `Industrial telemetry, alarms, and maintenance flows remain scoped to ${scopeName} through the current ${workspaceLabel.toLowerCase()}.`;
}

function resolveWorkspaceMode(platformOwner: boolean, systemAdmin: boolean) {
  if (platformOwner) {
    return 'Platform-owner tenant';
  }

  if (systemAdmin) {
    return 'Internal support session';
  }

  return 'Customer tenant';
}

function resolveIotTone(status?: string | null) {
  if (!status) {
    return 'cyan' as const;
  }

  const normalized = status.toLowerCase();

  if (normalized.includes('offline') || normalized.includes('critical')) {
    return 'red' as const;
  }

  if (normalized.includes('warn') || normalized.includes('pending') || normalized.includes('open') || normalized.includes('alert')) {
    return 'amber' as const;
  }

  if (normalized.includes('active') || normalized.includes('ok') || normalized.includes('online') || normalized.includes('healthy')) {
    return 'green' as const;
  }

  return 'cyan' as const;
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return 'No timestamp available';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function IotWorkspaceActionLink({
  href,
  eyebrow,
  title,
  description,
  capability = readyCapability()
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  capability?: ModuleCapability;
}) {
  const interactive = capability.interactive;
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      {!isCapabilityReady(capability) && (capability.title || capability.description) ? (
        <div className="mt-4 rounded-[22px] border border-dashed border-slate-700 bg-slate-950/45 px-4 py-3">
          {capability.title ? <p className="text-sm font-semibold text-white">{capability.title}</p> : null}
          {capability.description ? <p className="mt-1 text-sm text-slate-400">{capability.description}</p> : null}
        </div>
      ) : null}
      <span className="mt-5 inline-flex text-sm font-semibold text-cyan-200 transition group-hover:translate-x-1">
        {capability.actionLabel}
      </span>
    </>
  );

  if (interactive) {
    return (
      <Link
        href={href}
        className="group rounded-[28px] border border-slate-800 bg-slate-950/35 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-slate-950/65"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-[28px] border border-dashed border-slate-700 bg-slate-950/35 p-5 opacity-90">
      {content}
    </div>
  );
}

function buildIotGuidanceSteps(actions: ModuleWorkspaceAction[], keys: string[]) {
  return keys
    .map((key) => actions.find((action) => action.href === key))
    .filter((action): action is ModuleWorkspaceAction => Boolean(action));
}

function isIotFirstUse(summary: IotDashboardSummary) {
  return summary.totalDevices === 0
    && summary.activeDevices === 0
    && summary.offlineDevices === 0
    && summary.totalAlarmsOpen === 0
    && summary.telemetryPointsLast24h === 0
    && summary.pendingMaintenance === 0;
}

export function IotHome() {
  const platform = useFrontendPlatform();
  const { hasPermission } = usePermissions();
  const [summary, setSummary] = useState<IotDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('iot.dashboard.read');
  const activitySection = summary?.sections.find((section) => section.items.length > 0) ?? null;
  const firstUse = summary ? isIotFirstUse(summary) : false;
  const actionStates = iotWorkspaceActions
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

      if (firstUse && action.href === '/iot/telemetry') {
        const capability = notConfiguredCapability({
          title: 'Telemetry is not configured yet',
          description: 'Onboard devices and register mappings before live telemetry can start surfacing inside this workspace.'
        });

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/iot/alarms') {
        const capability = notConfiguredCapability({
          title: 'Alarm flow is not configured yet',
          description: 'Alarm visibility begins after the first connected assets and thresholded register mappings are in place.'
        });

        return { ...action, capability, status: capability.status };
      }

      if (!firstUse && summary.telemetryPointsLast24h === 0 && action.href === '/iot/telemetry') {
        const capability = noDataCapability({
          title: 'No telemetry collected yet',
          description: 'The workspace has connected assets, but no telemetry points were collected during the latest 24-hour window.'
        });

        return { ...action, capability, status: capability.status };
      }

      return action;
    });
  const availableActions = actionStates.filter((action) => action.capability?.interactive !== false);
  const primaryAction = availableActions.find((action) => action.href === '/iot/dashboard') ?? availableActions[0] ?? null;
  const themePolicy = platform.theme.canOverride
    ? `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} with user override`
    : `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} tenant-managed`;
  const setupGuidance = buildIotGuidanceSteps(actionStates, ['/iot/add-device', '/iot/devices', '/iot/registers']);
  const restrictedGuidance = buildIotGuidanceSteps(actionStates, ['/iot/devices', '/iot/alarms', '/iot/telemetry']);

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

    iotService
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
        setError(err instanceof ApiClientError ? err.message : 'Unable to load the IoT workspace summary.');
        setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [canReadDashboard]);

  return (
    <div className="space-y-6" style={platform.branding.style}>
      <IotPageHeader
        eyebrow="IoT Workspace"
        title={`${platform.branding.scopeName} · Connected Operations`}
        description={resolveIotWorkspaceDescription(
          platform.branding.scopeName,
          platform.workspace.workspaceLabel,
          platform.workspace.isPlatformOwnerTenant,
          platform.workspace.hasSystemAdminRole
        )}
        chips={
          <>
            <Chip label="Workspace" value={platform.workspace.workspaceLabel} tone="cyan" icon={<DashboardIcon />} />
            <Chip label="Tenant" value={platform.branding.tenantCode ?? platform.branding.scopeName} tone="amber" icon={<FactoryIcon />} />
            <Chip label="Theme" value={getAppThemeModeLabel(platform.theme.tenantDefaultMode)} tone="green" icon={<WaveIcon />} />
            <Chip label="Actions" value={availableActions.length} tone="neutral" icon={<PlugIcon />} />
          </>
        }
        action={primaryAction ? <IotActionButton href={primaryAction.href}>{primaryAction.title}</IotActionButton> : null}
        aside={(
          <IotHeroAside
            title="Workspace context"
            items={[
              {
                label: 'Mode',
                value: resolveWorkspaceMode(platform.workspace.isPlatformOwnerTenant, platform.workspace.hasSystemAdminRole),
                tone: platform.workspace.isPlatformOwnerTenant ? 'green' : platform.workspace.hasSystemAdminRole ? 'amber' : 'cyan'
              },
              {
                label: 'Access',
                value: platform.workspace.accessLabel,
                tone: platform.workspace.isPlatformOwnerTenant ? 'green' : 'cyan'
              },
              {
                label: 'Theme policy',
                value: themePolicy,
                tone: platform.theme.canOverride ? 'cyan' : 'amber'
              }
            ]}
          />
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5 shadow-[0_18px_50px_rgba(2,8,20,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
            Workspace identity
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{platform.branding.scopeName}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Controlled tenant branding only touches accent areas here, while the operational IoT surfaces keep their module-specific visual language.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span
              className="inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--tenant-accent)]"
              style={{
                borderColor: 'var(--tenant-accent)',
                backgroundColor: 'var(--tenant-accent-soft)'
              }}
            >
              Contracted IoT surface
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
              {themePolicy}
            </span>
          </div>
        </div>

        <IotMetricCard
          label="Active devices"
          value={canReadDashboard && summary ? summary.activeDevices : '--'}
          footnote={canReadDashboard ? 'Online assets currently reporting into this workspace.' : 'Requires dashboard visibility.'}
          status={!canReadDashboard ? 'No permission' : summary && firstUse ? 'Setup required' : undefined}
          detailTitle={!canReadDashboard
            ? 'Dashboard visibility required'
            : summary && firstUse
              ? 'Fleet not configured yet'
              : undefined}
          detailDescription={!canReadDashboard
            ? 'Grant `iot.dashboard.read` to surface live fleet counts from this workspace landing page.'
            : summary && firstUse
              ? 'Onboard the first connected assets before active device health can surface here.'
              : undefined}
          tone="green"
          icon={<DeviceIcon />}
        />
        <IotMetricCard
          label="Open alarms"
          value={canReadDashboard && summary ? summary.totalAlarmsOpen : '--'}
          footnote={canReadDashboard ? 'Operational incidents still open in the current IoT workspace.' : 'Requires dashboard visibility.'}
          status={!canReadDashboard ? 'No permission' : summary && firstUse ? 'Setup required' : undefined}
          detailTitle={!canReadDashboard
            ? 'Dashboard visibility required'
            : summary && firstUse
              ? 'Alarm flow not configured yet'
              : undefined}
          detailDescription={!canReadDashboard
            ? 'Grant `iot.dashboard.read` to surface open incident counts from this workspace landing page.'
            : summary && firstUse
              ? 'Alarm volume appears after the first assets and threshold-driven monitoring signals are established.'
              : undefined}
          tone={summary && summary.totalAlarmsOpen > 0 ? 'amber' : 'cyan'}
          icon={<AlarmIcon />}
        />
        <IotMetricCard
          label="Pending maintenance"
          value={canReadDashboard && summary ? summary.pendingMaintenance : '--'}
          footnote={canReadDashboard ? 'Interventions still pending for connected assets.' : 'Requires dashboard visibility.'}
          status={!canReadDashboard ? 'No permission' : summary && firstUse ? 'Setup required' : undefined}
          detailTitle={!canReadDashboard
            ? 'Dashboard visibility required'
            : summary && firstUse
              ? 'Maintenance flow not configured yet'
              : undefined}
          detailDescription={!canReadDashboard
            ? 'Grant `iot.dashboard.read` to surface pending maintenance counts from this workspace landing page.'
            : summary && firstUse
              ? 'Maintenance backlog appears after devices, alarms, and intervention work begin moving through the workspace.'
              : undefined}
          tone={summary && summary.pendingMaintenance > 0 ? 'amber' : 'cyan'}
          icon={<PlugIcon />}
        />
      </div>

      <IotPanel
        title="Workspace Actions"
        description="Open the IoT surfaces currently contracted for the tenant and allowed for the active user."
      >
        {actionStates.length === 0 ? (
          <IotEmptyState
            title="No IoT actions available"
            description="The IoT module is enabled for this tenant, but the current user does not have IoT read permissions yet."
            tone="amber"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {actionStates.map((action) => (
              <IotWorkspaceActionLink
                key={action.href}
                href={action.href}
                eyebrow={action.eyebrow}
                title={action.title}
                description={action.description}
                capability={action.capability}
              />
            ))}
          </div>
        )}
      </IotPanel>

      <IotPanel
        title="Operational Pulse"
        description="Keep a small live slice of alarms, telemetry, and recent operational items visible before moving deeper into the module."
      >
        {!canReadDashboard ? (
          <div className="space-y-4">
            <IotNotice
              title="Operational pulse restricted"
              description="The IoT workspace is available, but the operational pulse requires `iot.dashboard.read`. Continue through the permitted fleet and incident flows below."
              tone="amber"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {restrictedGuidance.map((action) => (
                <IotWorkspaceActionLink
                  key={action.href}
                  href={action.href}
                  eyebrow={action.eyebrow}
                  title={action.title}
                  description={action.capability?.kind === 'ready' ? action.description : action.capability?.description ?? action.description}
                  capability={action.capability}
                />
              ))}
            </div>
          </div>
        ) : loadingSummary ? (
          <IotNotice
            title="Loading IoT summary"
            description="Collecting the latest operational overview for the connected workspace."
            tone="cyan"
          />
        ) : error ? (
          <div className="space-y-4">
            <IotNotice
              title="IoT summary unavailable"
              description={error}
              tone="amber"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {restrictedGuidance.map((action) => (
                <IotWorkspaceActionLink
                  key={action.href}
                  href={action.href}
                  eyebrow={action.eyebrow}
                  title={action.title}
                  description={action.capability?.kind === 'ready' ? action.description : action.capability?.description ?? action.description}
                  capability={action.capability}
                />
              ))}
            </div>
          </div>
        ) : summary && firstUse ? (
          <GettingStartedChecklist
            eyebrow="IoT Onboarding"
            title="Set up the IoT workspace"
            description="This tenant does not have connected assets or live telemetry yet. Work through the checklist below to onboard devices, mappings, and the first operational signals."
            steps={setupGuidance.map((action) => ({
              key: action.href,
              eyebrow: action.eyebrow,
              title: action.title,
              description: action.capability?.kind === 'ready' ? action.description : action.capability?.description ?? action.description,
              href: action.capability?.interactive === false ? undefined : action.href,
              status: action.capability?.status ?? action.status ?? null,
              actionLabel: action.capability?.actionLabel
            }))}
            variant="dark"
          />
        ) : summary ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <IotMetricCard
                label="Telemetry in 24h"
                value={summary.telemetryPointsLast24h}
                footnote="Collected points over the last 24 hours for this workspace."
                status={summary.telemetryPointsLast24h === 0 ? 'No data' : undefined}
                detailTitle={summary.telemetryPointsLast24h === 0 ? 'No telemetry collected yet' : undefined}
                detailDescription={summary.telemetryPointsLast24h === 0
                  ? 'Connected assets are present, but the latest 24-hour window returned no telemetry points for this workspace.'
                  : undefined}
                tone="cyan"
                icon={<WaveIcon />}
              />
              <IotMetricCard
                label="Offline devices"
                value={summary.offlineDevices}
                footnote="Assets that still need communication recovery."
                tone={summary.offlineDevices > 0 ? 'red' : 'green'}
                icon={<DeviceIcon />}
              />
              <IotMetricCard
                label="Total fleet"
                value={summary.totalDevices}
                footnote="Connected assets currently attached to the tenant IoT workspace."
                tone="neutral"
                icon={<FactoryIcon />}
              />
            </div>

            {activitySection ? (
              <div className="grid gap-4 md:grid-cols-3">
                {activitySection.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[28px] border border-slate-800 bg-slate-950/35 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {activitySection.title}
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
                      </div>
                      <IotStatusPill label={item.status ?? 'Info'} tone={resolveIotTone(item.status)} />
                    </div>
                    {item.sublabel ? (
                      <p className="mt-3 text-sm leading-6 text-slate-400">{item.sublabel}</p>
                    ) : null}
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <IotEmptyState
                  title="No recent operational items"
                  description="The current IoT dashboard summary returned no recent-item activity block for this tenant. Continue through the permitted workspace flows below."
                  tone="neutral"
                />
                <div className="grid gap-4 md:grid-cols-3">
                  {restrictedGuidance.map((action) => (
                    <IotWorkspaceActionLink
                      key={action.href}
                      href={action.href}
                      eyebrow={action.eyebrow}
                      title={action.title}
                      description={action.capability?.kind === 'ready' ? action.description : action.capability?.description ?? action.description}
                      capability={action.capability}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <IotEmptyState
            title="No IoT summary available"
            description="No IoT dashboard data was returned for the current tenant workspace."
            tone="neutral"
          />
        )}
      </IotPanel>
    </div>
  );
}
