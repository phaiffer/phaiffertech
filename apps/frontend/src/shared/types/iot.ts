export type IotDevice = {
  id: string;
  name: string;
  identifier: string;
  serialNumber?: string;
  type?: string;
  location?: string;
  description?: string;
  status: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type IotRegister = {
  id: string;
  deviceId: string;
  name: string;
  code: string;
  metricName: string;
  unit?: string;
  dataType: string;
  minThreshold?: number;
  maxThreshold?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type IotAlarm = {
  id: string;
  deviceId: string;
  registerId?: string;
  code: string;
  message: string;
  severity: string;
  status: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type IotTelemetryRecord = {
  id: string;
  deviceId: string;
  registerId?: string;
  metricName: string;
  metricValue: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  recordedAt: string;
  createdAt: string;
};

export type IotMaintenance = {
  id: string;
  deviceId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  scheduledAt?: string;
  completedAt?: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type IotDashboardSummary = {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalAlarmsOpen: number;
  alarmsBySeverity: Record<string, number>;
  telemetryPointsLast24h: number;
  pendingMaintenance: number;
  devicesLastSeenSummary: Record<string, number>;
};

export type IotReportSummary = {
  totalDevices: number;
  totalRegisters: number;
  telemetryPointsLast24h: number;
  openAlarms: number;
  pendingMaintenance: number;
  devicesByStatus: Record<string, number>;
  telemetryByMetric: Record<string, number>;
  alarmsByStatus: Record<string, number>;
  alarmsBySeverity: Record<string, number>;
  maintenanceByStatus: Record<string, number>;
  generatedAt: string;
};
