import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { IotDevice } from '@/shared/types/iot';

export type CreateDeviceInput = {
  name: string;
  serialNumber: string;
  status?: string;
};

export const iotService = {
  listDevices: (page = 0, size = 20) =>
    apiClient.get<PageResponse<IotDevice>>(`/iot/devices?page=${page}&size=${size}`),
  createDevice: (input: CreateDeviceInput) => apiClient.post<IotDevice>('/iot/devices', input)
};
