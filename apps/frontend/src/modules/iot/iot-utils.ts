import { DashboardSection, DashboardSummaryCard } from '@/shared/types/dashboard';
import { IotDashboardSummary, IotDevice, IotRegister } from '@/shared/types/iot';

export function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-BR');
}

export function toDateTimeLocal(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function toIsoDate(value: string) {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

export function sortedEntries(record: Record<string, number>) {
  return Object.entries(record).sort((left, right) => right[1] - left[1]);
}

export function resolveDeviceLabel(devices: IotDevice[], deviceId: string) {
  const device = devices.find((entry) => entry.id === deviceId);
  if (!device) {
    return deviceId;
  }

  return `${device.name} (${device.identifier ?? device.serialNumber ?? '-'})`;
}

export function resolveRegisterLabel(registers: IotRegister[], registerId?: string) {
  if (!registerId) {
    return '-';
  }

  const register = registers.find((entry) => entry.id === registerId);
  if (!register) {
    return registerId;
  }

  return `${register.name} (${register.metricName})`;
}

export function resolveDeviceStatusLabel(status?: string) {
  switch (status) {
    case 'ONLINE':
      return 'Online';
    case 'OFFLINE':
      return 'Offline';
    case 'MAINTENANCE':
      return 'Em manutenção';
    case 'ALERT':
      return 'Em alerta';
    default:
      return status ?? '-';
  }
}

export function resolveDeviceTypeLabel(type?: string) {
  switch (type) {
    case 'SENSOR':
      return 'Sensor';
    case 'GATEWAY':
      return 'Gateway';
    case 'ACTUATOR':
      return 'Atuador';
    default:
      return type ?? '-';
  }
}

export function resolveAlarmStatusLabel(status?: string) {
  switch (status) {
    case 'OPEN':
      return 'Aberto';
    case 'ACKNOWLEDGED':
      return 'Reconhecido';
    case 'RESOLVED':
      return 'Resolvido';
    default:
      return status ?? '-';
  }
}

export function resolveAlarmSeverityLabel(severity?: string) {
  switch (severity) {
    case 'LOW':
      return 'Baixa';
    case 'MEDIUM':
      return 'Média';
    case 'HIGH':
      return 'Alta';
    case 'CRITICAL':
      return 'Crítica';
    default:
      return severity ?? '-';
  }
}

export function resolveRegisterStatusLabel(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Ativo';
    case 'INACTIVE':
      return 'Inativo';
    case 'MAINTENANCE':
      return 'Em manutenção';
    default:
      return status ?? '-';
  }
}

export function resolveMaintenanceStatusLabel(status?: string) {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'SCHEDULED':
      return 'Agendada';
    case 'IN_PROGRESS':
      return 'Em execução';
    case 'COMPLETED':
      return 'Concluída';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status ?? '-';
  }
}

export function resolveMaintenancePriorityLabel(priority?: string) {
  switch (priority) {
    case 'LOW':
      return 'Baixa';
    case 'MEDIUM':
      return 'Média';
    case 'HIGH':
      return 'Alta';
    case 'CRITICAL':
      return 'Crítica';
    default:
      return priority ?? '-';
  }
}

export function resolveTelemetryQualityLabel(quality?: string) {
  switch (quality) {
    case 'GOOD':
      return 'Boa';
    case 'WARN':
      return 'Atenção';
    case 'STALE':
      return 'Sem atualização';
    default:
      return quality ?? '-';
  }
}

function formatRecencyBucketLabel(bucket: string) {
  switch (bucket) {
    case 'last_5m':
      return 'Seen in last 5 min';
    case 'last_60m':
      return 'Seen in last 60 min';
    case 'stale':
      return 'Stale devices';
    case 'never_seen':
      return 'Never seen';
    default:
      return bucket;
  }
}

function buildOpenAlarmTrend(totalAlarmsOpen: number, alarmsBySeverity: Record<string, number>) {
  if (totalAlarmsOpen === 0) {
    return 'No open alarms in the current tenant.';
  }

  const topSeverity = sortedEntries(alarmsBySeverity)[0];
  if (!topSeverity) {
    return `${totalAlarmsOpen} open alarms require attention.`;
  }

  return `${topSeverity[1]} ${topSeverity[0].toLowerCase()} alarms currently drive the highest pressure.`;
}

function buildTelemetryTrend(telemetryPointsLast24h: number) {
  if (telemetryPointsLast24h === 0) {
    return 'No telemetry points were recorded in the last 24 hours.';
  }

  if (telemetryPointsLast24h < 25) {
    return 'Telemetry volume is low and easy to inspect manually.';
  }

  if (telemetryPointsLast24h < 250) {
    return 'Telemetry flow is healthy for a demo and operational review.';
  }

  return 'Telemetry volume is high enough to support monitoring conversations.';
}

function buildMaintenanceTrend(pendingMaintenance: number) {
  if (pendingMaintenance === 0) {
    return 'No maintenance backlog is pending right now.';
  }

  if (pendingMaintenance === 1) {
    return 'There is 1 pending maintenance work order.';
  }

  return `${pendingMaintenance} maintenance work orders are currently pending.`;
}

function buildOfflineTrend(totalDevices: number, offlineDevices: number) {
  if (totalDevices === 0) {
    return 'No devices are registered for the current tenant.';
  }

  if (offlineDevices === 0) {
    return 'All devices are reporting as active.';
  }

  return `${offlineDevices} of ${totalDevices} devices require connectivity review.`;
}

export function buildIotExecutiveCards(summary: IotDashboardSummary): DashboardSummaryCard[] {
  return [
    {
      key: 'iot-total-devices',
      label: 'Fleet Size',
      value: summary.totalDevices,
      status: 'info',
      href: '/iot/devices',
      trend: `${summary.activeDevices} active · ${summary.offlineDevices} offline`
    },
    {
      key: 'iot-open-alarms',
      label: 'Open Alarms',
      value: summary.totalAlarmsOpen,
      status: summary.totalAlarmsOpen > 0 ? 'alert' : 'ok',
      href: '/iot/alarms',
      trend: buildOpenAlarmTrend(summary.totalAlarmsOpen, summary.alarmsBySeverity)
    },
    {
      key: 'iot-telemetry-24h',
      label: 'Telemetry 24h',
      value: summary.telemetryPointsLast24h,
      status: summary.telemetryPointsLast24h > 0 ? 'info' : 'warn',
      href: '/iot/telemetry',
      trend: buildTelemetryTrend(summary.telemetryPointsLast24h)
    },
    {
      key: 'iot-maintenance-backlog',
      label: 'Pending Maintenance',
      value: summary.pendingMaintenance,
      status: summary.pendingMaintenance > 0 ? 'warn' : 'ok',
      href: '/iot/maintenance',
      trend: buildMaintenanceTrend(summary.pendingMaintenance)
    },
    {
      key: 'iot-active-devices',
      label: 'Active Devices',
      value: summary.activeDevices,
      status: summary.activeDevices > 0 ? 'ok' : 'warn',
      href: '/iot/devices',
      trend: `${summary.activeDevices} devices are considered active right now.`
    },
    {
      key: 'iot-offline-devices',
      label: 'Offline Devices',
      value: summary.offlineDevices,
      status: summary.offlineDevices > 0 ? 'warn' : 'ok',
      href: '/iot/devices',
      trend: buildOfflineTrend(summary.totalDevices, summary.offlineDevices)
    }
  ];
}

export function buildIotExecutiveOverviewSection(summary: IotDashboardSummary): DashboardSection {
  return {
    key: 'iot-operational-overview',
    title: 'Operational Snapshot',
    description:
      'Executive baseline for fleet availability, telemetry flow, alarm pressure and maintenance workload.',
    cards: [],
    metrics: [
      {
        key: 'iot-operational-total-devices',
        label: 'Total Devices',
        value: summary.totalDevices
      },
      {
        key: 'iot-operational-active-devices',
        label: 'Active Devices',
        value: summary.activeDevices
      },
      {
        key: 'iot-operational-offline-devices',
        label: 'Offline Devices',
        value: summary.offlineDevices
      },
      {
        key: 'iot-operational-open-alarms',
        label: 'Open Alarms',
        value: summary.totalAlarmsOpen
      },
      {
        key: 'iot-operational-telemetry-24h',
        label: 'Telemetry 24h',
        value: summary.telemetryPointsLast24h
      },
      {
        key: 'iot-operational-pending-maintenance',
        label: 'Pending Maintenance',
        value: summary.pendingMaintenance
      }
    ],
    items: [
      {
        id: 'iot-operational-item-alarms',
        label: 'Alarm pressure',
        sublabel: buildOpenAlarmTrend(summary.totalAlarmsOpen, summary.alarmsBySeverity),
        status: summary.totalAlarmsOpen > 0 ? 'alert' : 'ok',
        href: '/iot/alarms'
      },
      {
        id: 'iot-operational-item-telemetry',
        label: 'Telemetry throughput',
        sublabel: buildTelemetryTrend(summary.telemetryPointsLast24h),
        status: summary.telemetryPointsLast24h > 0 ? 'info' : 'warn',
        href: '/iot/telemetry'
      },
      {
        id: 'iot-operational-item-maintenance',
        label: 'Maintenance backlog',
        sublabel: buildMaintenanceTrend(summary.pendingMaintenance),
        status: summary.pendingMaintenance > 0 ? 'warn' : 'ok',
        href: '/iot/maintenance'
      }
    ],
    timeSeries: []
  };
}

export function buildIotFleetRecencySection(summary: IotDashboardSummary): DashboardSection {
  const recencyMetrics = sortedEntries(summary.devicesLastSeenSummary).map(([bucket, value]) => ({
    key: `iot-recency-${bucket}`,
    label: formatRecencyBucketLabel(bucket),
    value
  }));

  return {
    key: 'iot-fleet-recency-overview',
    title: 'Fleet Recency',
    description:
      'Device freshness buckets derived from last seen timestamps to support operational triage.',
    cards: [],
    metrics: recencyMetrics,
    items: [
      {
        id: 'iot-recency-stale',
        label: 'Stale fleet pressure',
        sublabel:
          summary.devicesLastSeenSummary.stale > 0
            ? `${summary.devicesLastSeenSummary.stale} devices are stale and should be inspected.`
            : 'No stale devices were detected.',
        status: summary.devicesLastSeenSummary.stale > 0 ? 'warn' : 'ok',
        href: '/iot/devices'
      },
      {
        id: 'iot-recency-never-seen',
        label: 'Devices never seen',
        sublabel:
          summary.devicesLastSeenSummary.never_seen > 0
            ? `${summary.devicesLastSeenSummary.never_seen} devices never reported telemetry yet.`
            : 'Every registered device has reported at least once.',
        status: summary.devicesLastSeenSummary.never_seen > 0 ? 'warn' : 'ok',
        href: '/iot/devices'
      }
    ],
    timeSeries: []
  };
}

export function orderIotDashboardSections(sections: DashboardSection[]) {
  /**
   * Orders dashboard sections following a clear operational narrative.
   *
   * 1. Operational overview (executive snapshot)
   * 2. Fleet recency (device freshness)
   * 3. Alarm pressure
   * 4. Any additional backend-provided sections
   */

  const preferredOrder = [
    'iot-operational-overview',
    'iot-fleet-recency-overview',
    'iot-alarms',
    'iot-last-seen'
  ];

  return [...sections].sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left.key);
    const rightIndex = preferredOrder.indexOf(right.key);

    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeft - normalizedRight;
  });
}
