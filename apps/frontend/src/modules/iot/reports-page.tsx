'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotReportSummary } from '@/shared/types/iot';
import {
  AnalysisIcon,
  Chip,
  IotActionButton,
  IotHeroAside,
  IotMiniTrend,
  IotMetricCard,
  IotModulePage,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotStatusPill,
  IotSupportCard
} from '@/modules/iot/iot-chrome';
import { buildDemoReportSummary } from '@/modules/iot/iot-demo-data';
import {
  appendLiveTrendPoint,
  formatDateTime,
  sortedEntries
} from '@/modules/iot/iot-utils';

const reportsPollIntervalMs = 10_000;

function buildOperationalScore(report: IotReportSummary) {
  if (report.totalDevices === 0) {
    return 0;
  }

  const online = report.devicesByStatus.ONLINE ?? 0;
  const alert = report.devicesByStatus.ALERT ?? 0;
  const offline = report.devicesByStatus.OFFLINE ?? 0;
  const availabilityScore = (online / report.totalDevices) * 70;
  const telemetryBonus = report.telemetryPointsLast24h > 0 ? 20 : 0;
  const pressurePenalty = Math.min(35, report.openAlarms * 4 + report.pendingMaintenance * 3 + offline * 8 + alert * 4);

  return Math.max(0, Math.round(availabilityScore + telemetryBonus + 10 - pressurePenalty));
}

function DistributionBlock({
  title,
  values
}: {
  title: string;
  values: Record<string, number>;
}) {
  const entries = sortedEntries(values);

  return (
    <IotSupportCard className="p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted">No data returned for this dimension yet.</p>
        ) : null}
        {entries.map(([key, value]) => (
          <IotSupportCard
            key={key}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm text-foreground">{key}</span>
            <span className="text-sm font-semibold text-foreground">{value}</span>
          </IotSupportCard>
        ))}
      </div>
    </IotSupportCard>
  );
}

function resolveRecommendedAction(report: IotReportSummary, usingDemo: boolean) {
  if (usingDemo) {
    return {
      title: 'Register a first device',
      description: 'Move the workspace from assisted demo mode to a real industrial storyline by adding the first field asset.'
    };
  }

  if (report.openAlarms > 0) {
    return {
      title: 'Review alarm pressure',
      description: `${report.openAlarms} open alarm(s) are shaping the operational picture right now.`
    };
  }

  if (report.pendingMaintenance > 0) {
    return {
      title: 'Work the maintenance backlog',
      description: `${report.pendingMaintenance} maintenance item(s) still need field follow-through.`
    };
  }

  return {
    title: 'Review telemetry coverage',
    description: 'The workspace is stable enough to use this page as a reliability and performance readout.'
  };
}

export function IotReportsPage() {
  const [summary, setSummary] = useState<IotReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceSeries, setPerformanceSeries] = useState([
    { label: '09:20', value: 70 },
    { label: '09:30', value: 72 },
    { label: '09:40', value: 75 },
    { label: '09:50', value: 77 },
    { label: '10:00', value: 74 },
    { label: '10:10', value: 78 },
    { label: '10:20', value: 81 },
    { label: '10:30', value: 76 },
    { label: '10:40', value: 84 },
    { label: '10:50', value: 88 }
  ]);
  const [throughputSeries, setThroughputSeries] = useState([
    { label: '09:20', value: 72 },
    { label: '09:30', value: 84 },
    { label: '09:40', value: 92 },
    { label: '09:50', value: 104 },
    { label: '10:00', value: 96 },
    { label: '10:10', value: 124 },
    { label: '10:20', value: 148 },
    { label: '10:30', value: 172 },
    { label: '10:40', value: 196 },
    { label: '10:50', value: 224 }
  ]);

  useEffect(() => {
    let active = true;

    async function load(background = false) {
      if (!background) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await iotService.getReportSummary();
        if (!active) {
          return;
        }

        const refreshedAt = new Date();
        setSummary(result);
        setPerformanceSeries((current) =>
          appendLiveTrendPoint(current, buildOperationalScore(result), refreshedAt)
        );
        setThroughputSeries((current) =>
          appendLiveTrendPoint(current, result.telemetryPointsLast24h, refreshedAt)
        );
        setError(null);
      } catch (err) {
        if (!active || background) {
          return;
        }

        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Unable to load the IoT reporting summary.'
        );
      } finally {
        if (active && !background) {
          setLoading(false);
        }
      }
    }

    void load();

    const intervalId = window.setInterval(() => {
      void load(true);
    }, reportsPollIntervalMs);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const report = useMemo(() => {
    if (!summary || summary.totalDevices === 0) {
      return buildDemoReportSummary();
    }

    return summary;
  }, [summary]);

  const usingDemo = !summary || summary.totalDevices === 0 || Boolean(error);
  const operationalScore = buildOperationalScore(report);
  const criticalAlarms = (report.alarmsBySeverity.CRITICAL ?? 0) + (report.alarmsBySeverity.HIGH ?? 0);
  const recommendedAction = resolveRecommendedAction(report, usingDemo);
  const coverageLabel = report.totalDevices > 1 ? 'Multi-asset' : report.totalDevices === 1 ? 'Single asset' : 'Assisted demo';

  return (
    <PermissionGuard
      permission="iot.report.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You do not have permission to view IoT reports.
        </div>
      }
    >
      <IotModulePage>
        <IotPageHeader
          eyebrow="Operational intelligence"
          title="Consolidated IoT reports"
          description="A more intentional executive surface for availability, alarm pressure, telemetry, and maintenance readiness across the IoT workspace."
          chips={
            <>
              <Chip label="Coverage" value={coverageLabel} tone="green" icon={<AnalysisIcon />} />
              <Chip label="Devices" value={report.totalDevices} tone="cyan" />
              <Chip label="Telemetry 24h" value={report.telemetryPointsLast24h} tone="neutral" />
            </>
          }
          action={<IotActionButton href="/iot/dashboard">Back to dashboard</IotActionButton>}
          aside={
            <IotHeroAside
              title="Panel state"
              items={[
                { label: 'Read mode', value: usingDemo ? 'Assisted demo' : 'Live integration', tone: usingDemo ? 'amber' : 'green' },
                { label: 'Operational score', value: `${operationalScore}%`, tone: operationalScore >= 80 ? 'green' : operationalScore >= 60 ? 'cyan' : 'amber' },
                {
                  label: 'Last refresh',
                  value: loading ? 'Syncing now' : formatDateTime(report.generatedAt),
                  tone: loading ? 'cyan' : 'green'
                }
              ]}
            />
          }
        />

        {usingDemo ? (
          <IotNotice
            title={error ? 'Live reporting is unavailable' : 'Assisted demo mode is active'}
            description={
              error
                ? `${error} The page remains usable with an assisted dataset that still mirrors dashboard, alarms, and maintenance narratives.`
                : 'No live device summary is available yet, so the page stays presentation-ready with a guided demo dataset.'
            }
            tone="amber"
            action={<IotActionButton href="/iot/add-device">Add first device</IotActionButton>}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <IotMetricCard
            label="Operational score"
            value={`${operationalScore}%`}
            footnote="Synthetic readout that balances availability, telemetry, alarms, and maintenance pressure."
            tone={operationalScore >= 80 ? 'green' : operationalScore >= 60 ? 'cyan' : 'amber'}
          />
          <IotMetricCard
            label="Connected assets"
            value={report.totalDevices}
            footnote={`${report.totalRegisters} mapped register(s) included in the summary.`}
            tone="cyan"
          />
          <IotMetricCard
            label="Open alarms"
            value={report.openAlarms}
            footnote={criticalAlarms > 0 ? `${criticalAlarms} critical/high alarm(s) demand attention.` : 'No critical or high alarm pressure right now.'}
            tone={report.openAlarms > 0 ? 'amber' : 'green'}
          />
          <IotMetricCard
            label="Pending maintenance"
            value={report.pendingMaintenance}
            footnote="Backlog that still needs planned field follow-through."
            tone={report.pendingMaintenance > 0 ? 'amber' : 'green'}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <IotPanel
            title="Performance trend"
            description="A lighter-weight decision-support chart that stays credible for demos without needing a new analytics backend."
          >
            <IotMiniTrend title="Operational score pulse" series={performanceSeries} accent="var(--tenant-accent)" />
          </IotPanel>

          <IotPanel
            title="Decision support"
            description="Keep the main commercial and operational takeaways visible without forcing users to interpret every distribution first."
          >
            <div className="space-y-3">
              <IotSupportCard className="px-4 py-4">
                <p className="text-sm font-semibold text-foreground">Recommended next step</p>
                <p className="mt-2 text-sm text-muted">{recommendedAction.title}</p>
                <p className="mt-1 text-sm text-muted">{recommendedAction.description}</p>
              </IotSupportCard>
              <IotSupportCard className="px-4 py-4">
                <p className="text-sm font-semibold text-foreground">Commercial story</p>
                <p className="mt-2 text-sm text-muted">
                  Use this page to explain reliability, telemetry coverage, and field backlog in one coherent executive narrative.
                </p>
              </IotSupportCard>
              <IotSupportCard className="px-4 py-4">
                <p className="text-sm font-semibold text-foreground">Current mode</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <IotStatusPill label={usingDemo ? 'Assisted dataset' : 'Live dataset'} tone={usingDemo ? 'amber' : 'green'} />
                  <IotStatusPill label={coverageLabel} tone="neutral" />
                </div>
              </IotSupportCard>
            </div>
          </IotPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <IotPanel
            title="Collection rhythm"
            description="Visual cadence of incoming telemetry to reinforce temporal coverage and signal freshness."
          >
            <IotMiniTrend title="Telemetry pulse" series={throughputSeries} accent="var(--info)" />
          </IotPanel>
          <IotPanel
            title="Distribution summary"
            description="Compact blocks for explaining how the platform organizes operational state across the module."
          >
            <div className="grid gap-4">
              <DistributionBlock title="Devices by status" values={report.devicesByStatus} />
              <DistributionBlock title="Alarms by severity" values={report.alarmsBySeverity} />
              <DistributionBlock title="Maintenance by status" values={report.maintenanceByStatus} />
              <DistributionBlock title="Telemetry by metric" values={report.telemetryByMetric} />
            </div>
          </IotPanel>
        </div>
      </IotModulePage>
    </PermissionGuard>
  );
}
