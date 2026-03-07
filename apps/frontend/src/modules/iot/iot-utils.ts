import { IotDevice, IotRegister } from '@/shared/types/iot';

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
