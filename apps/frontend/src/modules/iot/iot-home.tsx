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
    permission: 'iot.dashboard.read'
  },
  {
    href: '/iot/devices',
    eyebrow: 'Fleet',
    title: 'Inspect devices',
    description: 'Open the connected asset inventory with communication and operational context.',
    permission: 'iot.device.read'
  },
  {
    href: '/iot/add-device',
    eyebrow: 'Onboarding',
    title: 'Register device',
    description: 'Launch the guided Modbus onboarding flow for a new asset.',
    permission: 'iot.device.create'
  },
  {
    href: '/iot/registers',
    eyebrow: 'Mapping',
    title: 'Review registers',
    description: 'Inspect Modbus functions, addresses, data types, and thresholds.',
    permission: 'iot.register.read'
  },
  {
    href: '/iot/telemetry',
    eyebrow: 'Stream',
    title: 'Open telemetry',
    description: 'Follow live records tied to devices, registers, and collection quality.',
    permission: 'iot.telemetry.read'
  },
  {
    href: '/iot/alarms',
    eyebrow: 'Incidents',
    title: 'Review alarms',
    description: 'Handle severity, acknowledgement flow, and active operational incidents.',
    permission: 'iot.alarm.read'
  },
  {
    href: '/iot/maintenance',
    eyebrow: 'Field work',
    title: 'Track maintenance',
    description: 'Review the intervention backlog tied to assets and alarm context.',
    permission: 'iot.maintenance.read'
  },
  {
    href: '/iot/reports',
    eyebrow: 'Reporting',
    title: 'Open reports',
    description: 'Inspect the current operational summary exported by the IoT workspace.',
    permission: 'iot.report.read'
  },
  {
    href: '/iot/observability',
    eyebrow: 'Observability',
    title: 'Review observability',
    description: 'Cross-check dashboard signals with telemetry, incidents, and maintenance flows.',
    permission: 'iot.report.read'
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
  description
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-slate-800 bg-slate-950/35 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-slate-950/65"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <span className="mt-5 inline-flex text-sm font-semibold text-cyan-200 transition group-hover:translate-x-1">
        Open workspace flow
      </span>
    </Link>
  );
}

export function IotHome() {
  const platform = useFrontendPlatform();
  const { hasPermission } = usePermissions();
  const [summary, setSummary] = useState<IotDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('iot.dashboard.read');
  const visibleActions = iotWorkspaceActions.filter((action) => !action.permission || hasPermission(action.permission));
  const primaryAction = visibleActions.find((action) => action.href === '/iot/dashboard') ?? visibleActions[0] ?? null;
  const themePolicy = platform.theme.canOverride
    ? `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} with user override`
    : `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} tenant-managed`;
  const activitySection = summary?.sections.find((section) => section.items.length > 0) ?? null;

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
            <Chip label="Actions" value={visibleActions.length} tone="neutral" icon={<PlugIcon />} />
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
          tone="green"
          icon={<DeviceIcon />}
        />
        <IotMetricCard
          label="Open alarms"
          value={canReadDashboard && summary ? summary.totalAlarmsOpen : '--'}
          footnote={canReadDashboard ? 'Operational incidents still open in the current IoT workspace.' : 'Requires dashboard visibility.'}
          tone={summary && summary.totalAlarmsOpen > 0 ? 'amber' : 'cyan'}
          icon={<AlarmIcon />}
        />
        <IotMetricCard
          label="Pending maintenance"
          value={canReadDashboard && summary ? summary.pendingMaintenance : '--'}
          footnote={canReadDashboard ? 'Interventions still pending for connected assets.' : 'Requires dashboard visibility.'}
          tone={summary && summary.pendingMaintenance > 0 ? 'amber' : 'cyan'}
          icon={<PlugIcon />}
        />
      </div>

      <IotPanel
        title="Workspace Actions"
        description="Open the IoT surfaces currently contracted for the tenant and allowed for the active user."
      >
        {visibleActions.length === 0 ? (
          <IotEmptyState
            title="No IoT actions available"
            description="The IoT module is enabled for this tenant, but the current user does not have IoT read permissions yet."
            tone="amber"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleActions.map((action) => (
              <IotWorkspaceActionLink
                key={action.href}
                href={action.href}
                eyebrow={action.eyebrow}
                title={action.title}
                description={action.description}
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
          <IotEmptyState
            title="Dashboard snapshot unavailable"
            description="The IoT workspace is available, but the operational pulse requires `iot.dashboard.read`."
            tone="amber"
          />
        ) : loadingSummary ? (
          <IotNotice
            title="Loading IoT summary"
            description="Collecting the latest operational overview for the connected workspace."
            tone="cyan"
          />
        ) : error ? (
          <IotNotice
            title="IoT summary unavailable"
            description={error}
            tone="amber"
          />
        ) : summary ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <IotMetricCard
                label="Telemetry in 24h"
                value={summary.telemetryPointsLast24h}
                footnote="Collected points over the last 24 hours for this workspace."
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
              <IotEmptyState
                title="No recent operational items"
                description="The current IoT dashboard summary returned no recent-item activity block for this tenant."
                tone="neutral"
              />
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
