import { describe, expect, it } from 'vitest';
import { buildDemoDevicesFromReal, getOperationalProfile } from '@/modules/iot/iot-demo-data';
import { appendLiveTrendPoint } from '@/modules/iot/iot-utils';
import { IotDevice } from '@/shared/types/iot';

function buildDevice(overrides: Partial<IotDevice> = {}): IotDevice {
  return {
    id: 'device-1',
    name: 'Demo Device',
    identifier: 'DEMO-IOT-001',
    type: 'GATEWAY',
    location: 'Utility Room',
    description: 'Demo device',
    status: 'ONLINE',
    createdAt: '2026-03-09T12:00:00Z',
    updatedAt: '2026-03-09T12:00:00Z',
    ...overrides
  };
}

describe('IoT demo helpers', () => {
  it('preserva os dispositivos reais quando a frota ja existe', () => {
    const realDevices = [buildDevice({ id: 'real-1', name: 'Real Device' })];

    expect(buildDemoDevicesFromReal(realDevices)).toBe(realDevices);
  });

  it('prioriza os campos explicitos de conexao Modbus no perfil operacional', () => {
    const device = buildDevice({
      host: '10.14.0.55',
      port: 1502,
      unitId: 7,
      transport: 'MODBUS_RTU',
      pollingProfile: '15s',
      gateway: 'gw-validation-01',
      location: 'Pump House'
    });

    const profile = getOperationalProfile(device, 0);

    expect(profile.host).toBe('10.14.0.55');
    expect(profile.port).toBe(1502);
    expect(profile.unitId).toBe(7);
    expect(profile.transport).toBe('Modbus RTU / RS-485');
    expect(profile.pollInterval).toBe('15s');
    expect(profile.gateway).toBe('gw-validation-01');
    expect(profile.area).toBe('Pump House');
  });

  it('mantem apenas os ultimos pulsos ao acumular serie viva', () => {
    let series = [] as Array<{ label: string; value: number }>;

    for (let index = 0; index < 7; index++) {
      series = appendLiveTrendPoint(
        series,
        index + 1,
        new Date(Date.UTC(2026, 2, 9, 10, index, 0))
      );
    }

    expect(series).toHaveLength(6);
    expect(series[0]?.value).toBe(2);
    expect(series[5]?.value).toBe(7);
  });
});
