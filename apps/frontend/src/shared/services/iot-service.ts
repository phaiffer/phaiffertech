import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import {
  IotAlarm,
  IotDashboardSummary,
  IotDevice,
  IotMaintenance,
  IotRegister,
  IotReportSummary,
  IotTelemetryRecord
} from '@/shared/types/iot';

export type CreateDeviceInput = {
  name: string;
  identifier: string;
  type?: string;
  location?: string;
  description?: string;
  status?: string;
};

export type UpdateDeviceInput = {
  name: string;
  identifier: string;
  type?: string;
  location?: string;
  description?: string;
  status: string;
};

export type CreateRegisterInput = {
  deviceId: string;
  name: string;
  code: string;
  metricName: string;
  unit?: string;
  dataType: string;
  minThreshold?: number;
  maxThreshold?: number;
  status?: string;
};

export type UpdateRegisterInput = {
  deviceId: string;
  name: string;
  code: string;
  metricName: string;
  unit?: string;
  dataType: string;
  minThreshold?: number;
  maxThreshold?: number;
  status: string;
};

export type CreateAlarmInput = {
  deviceId: string;
  registerId?: string;
  code: string;
  message: string;
  severity: string;
  status?: string;
  triggeredAt?: string;
};

export type UpdateAlarmInput = {
  deviceId: string;
  registerId?: string;
  code: string;
  message: string;
  severity: string;
  status: string;
  triggeredAt?: string;
  acknowledgedAt?: string;
};

export type WriteTelemetryInput = {
  deviceId: string;
  registerId?: string;
  metricName: string;
  metricValue: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  recordedAt?: string;
};

export type CreateMaintenanceInput = {
  deviceId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  scheduledAt?: string;
  completedAt?: string;
  assignedUserId?: string;
};

export type UpdateMaintenanceInput = {
  deviceId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  scheduledAt?: string;
  completedAt?: string;
  assignedUserId?: string;
};

type DeviceFilters = {
  type?: string;
  status?: string;
};

type RegisterFilters = {
  deviceId?: string;
  metricName?: string;
  status?: string;
};

type AlarmFilters = {
  deviceId?: string;
  registerId?: string;
  severity?: string;
  status?: string;
  triggeredFrom?: string;
  triggeredTo?: string;
};

type TelemetryFilters = {
  deviceId?: string;
  registerId?: string;
  metricName?: string;
  startAt?: string;
  endAt?: string;
};

type MaintenanceFilters = {
  deviceId?: string;
  status?: string;
  priority?: string;
  startAt?: string;
  endAt?: string;
};

function queryString(
  page = 0,
  size = 20,
  search = '',
  filters: Record<string, string | undefined | null> = {}
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

  listRegisters: (page = 0, size = 20, search = '', filters: RegisterFilters = {}) =>
    apiClient.get<PageResponse<IotRegister>>(
      `/iot/registers?${queryString(page, size, search, {
        deviceId: filters.deviceId,
        metricName: filters.metricName,
        status: filters.status
      })}`
    ),

  getRegister: (id: string) => apiClient.get<IotRegister>(`/iot/registers/${id}`),

  createRegister: (input: CreateRegisterInput) => apiClient.post<IotRegister>('/iot/registers', input),

  updateRegister: (id: string, input: UpdateRegisterInput) =>
    apiClient.put<IotRegister>(`/iot/registers/${id}`, input),

  deleteRegister: (id: string) => apiClient.delete<void>(`/iot/registers/${id}`),

  restoreRegister: (id: string) => apiClient.patch<IotRegister>(`/iot/registers/${id}/restore`),

  listAlarms: (page = 0, size = 20, search = '', filters: AlarmFilters = {}) =>
    apiClient.get<PageResponse<IotAlarm>>(
      `/iot/alarms?${queryString(page, size, search, {
        deviceId: filters.deviceId,
        registerId: filters.registerId,
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
        registerId: filters.registerId,
        metricName: filters.metricName,
        startAt: filters.startAt,
        endAt: filters.endAt
      })}`
    ),

  writeTelemetry: (input: WriteTelemetryInput) =>
    apiClient.post<IotTelemetryRecord>('/iot/telemetry', input),

  listMaintenance: (page = 0, size = 20, search = '', filters: MaintenanceFilters = {}) =>
    apiClient.get<PageResponse<IotMaintenance>>(
      `/iot/maintenance?${queryString(page, size, search, {
        deviceId: filters.deviceId,
        status: filters.status,
        priority: filters.priority,
        startAt: filters.startAt,
        endAt: filters.endAt
      })}`
    ),

  getMaintenance: (id: string) => apiClient.get<IotMaintenance>(`/iot/maintenance/${id}`),

  createMaintenance: (input: CreateMaintenanceInput) =>
    apiClient.post<IotMaintenance>('/iot/maintenance', input),

  updateMaintenance: (id: string, input: UpdateMaintenanceInput) =>
    apiClient.put<IotMaintenance>(`/iot/maintenance/${id}`, input),

  deleteMaintenance: (id: string) => apiClient.delete<void>(`/iot/maintenance/${id}`),

  restoreMaintenance: (id: string) => apiClient.patch<IotMaintenance>(`/iot/maintenance/${id}/restore`),

  getDashboardSummary: () => apiClient.get<IotDashboardSummary>('/iot/dashboard/summary'),

  getReportSummary: () => apiClient.get<IotReportSummary>('/iot/reports/summary')
};
