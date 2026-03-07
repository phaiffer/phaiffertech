export type IotDevice = {
  id: string;
  name: string;
  identifier: string;
  serialNumber?: string;
  type?: string;
  location?: string;
  status: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type IotAlarm = {
  id: string;
  deviceId: string;
  code: string;
  message: string;
  severity: string;
  status: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type IotTelemetryRecord = {
  id: string;
  deviceId: string;
  metricName: string;
  metricValue: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  recordedAt: string;
  createdAt: string;
};
