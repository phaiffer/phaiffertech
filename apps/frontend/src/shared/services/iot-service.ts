import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { IotAlarm, IotDevice, IotTelemetryRecord } from '@/shared/types/iot';

export type CreateDeviceInput = {
  name: string;
  identifier: string;
  type?: string;
  location?: string;
  status?: string;
};

export type UpdateDeviceInput = {
  name: string;
  identifier: string;
  type?: string;
  location?: string;
  status: string;
};

export type CreateAlarmInput = {
  deviceId: string;
  code: string;
  message: string;
  severity: string;
  status?: string;
  triggeredAt?: string;
};

export type UpdateAlarmInput = {
  deviceId: string;
  code: string;
  message: string;
  severity: string;
  status: string;
  triggeredAt?: string;
  acknowledgedAt?: string;
};

export type WriteTelemetryInput = {
  deviceId: string;
  metricName: string;
  metricValue: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  recordedAt?: string;
};

type DeviceFilters = {
  type?: string;
  status?: string;
};

type AlarmFilters = {
  deviceId?: string;
  severity?: string;
  status?: string;
  triggeredFrom?: string;
  triggeredTo?: string;
};

type TelemetryFilters = {
  deviceId?: string;
  recordedFrom?: string;
  recordedTo?: string;
};

function queryString(
  page = 0,
  size = 20,
  search = '',
  filters: Record<string, string | undefined> = {}
) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  if (search.trim()) {
    params.set('search', search.trim());
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value.trim()) {
      params.set(key, value.trim());
    }
  });

  return params.toString();
}

export const iotService = {
  listDevices: (page = 0, size = 20, search = '', filters: DeviceFilters = {}) =>
    apiClient.get<PageResponse<IotDevice>>(
      `/iot/devices?${queryString(page, size, search, {
        type: filters.type,
        status: filters.status
      })}`
    ),

  getDevice: (id: string) => apiClient.get<IotDevice>(`/iot/devices/${id}`),

  createDevice: (input: CreateDeviceInput) => apiClient.post<IotDevice>('/iot/devices', input),

  updateDevice: (id: string, input: UpdateDeviceInput) =>
    apiClient.put<IotDevice>(`/iot/devices/${id}`, input),

  deleteDevice: (id: string) => apiClient.delete<void>(`/iot/devices/${id}`),

  restoreDevice: (id: string) => apiClient.patch<IotDevice>(`/iot/devices/${id}/restore`),

  listAlarms: (page = 0, size = 20, search = '', filters: AlarmFilters = {}) =>
    apiClient.get<PageResponse<IotAlarm>>(
      `/iot/alarms?${queryString(page, size, search, {
        deviceId: filters.deviceId,
        severity: filters.severity,
        status: filters.status,
        triggeredFrom: filters.triggeredFrom,
        triggeredTo: filters.triggeredTo
      })}`
    ),

  getAlarm: (id: string) => apiClient.get<IotAlarm>(`/iot/alarms/${id}`),

  createAlarm: (input: CreateAlarmInput) => apiClient.post<IotAlarm>('/iot/alarms', input),

  updateAlarm: (id: string, input: UpdateAlarmInput) =>
    apiClient.put<IotAlarm>(`/iot/alarms/${id}`, input),

  deleteAlarm: (id: string) => apiClient.delete<void>(`/iot/alarms/${id}`),

  acknowledgeAlarm: (id: string) => apiClient.post<IotAlarm>(`/iot/alarms/${id}/acknowledge`),

  restoreAlarm: (id: string) => apiClient.patch<IotAlarm>(`/iot/alarms/${id}/restore`),

  listTelemetry: (page = 0, size = 20, search = '', filters: TelemetryFilters = {}) =>
    apiClient.get<PageResponse<IotTelemetryRecord>>(
      `/iot/telemetry?${queryString(page, size, search, {
        deviceId: filters.deviceId,
        recordedFrom: filters.recordedFrom,
        recordedTo: filters.recordedTo
      })}`
    ),

  writeTelemetry: (input: WriteTelemetryInput) =>
    apiClient.post<IotTelemetryRecord>('/iot/telemetry', input)
};
