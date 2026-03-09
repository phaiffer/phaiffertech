import { DashboardTimeSeriesPoint } from '@/shared/types/dashboard';
import { IotAlarm, IotDevice, IotReportSummary } from '@/shared/types/iot';

export type IotOperationalProfile = {
  host: string;
  port: number;
  unitId: number;
  transport: 'Modbus TCP' | 'Modbus RTU / RS-485';
  pollInterval: string;
  signal: string;
  area: string;
  gateway: string;
  registerCount: number;
  health: 'green' | 'amber' | 'red' | 'cyan';
};

export type ModbusVariableTemplate = {
  id: string;
  label: string;
  unit: string;
  registerAddress: string;
  functionCode: string;
  dataType: string;
  description: string;
};

const demoProfiles: IotOperationalProfile[] = [
  {
    host: '192.168.10.21',
    port: 502,
    unitId: 1,
    transport: 'Modbus TCP',
    pollInterval: '2 s',
    signal: 'LOW 18.4',
    area: 'QGBT Principal',
    gateway: 'GW-ENERGY-01',
    registerCount: 8,
    health: 'green'
  },
  {
    host: '192.168.10.22',
    port: 502,
    unitId: 2,
    transport: 'Modbus TCP',
    pollInterval: '5 s',
    signal: 'MED 8.2',
    area: 'Sala de Compressores',
    gateway: 'GW-HVAC-02',
    registerCount: 6,
    health: 'cyan'
  },
  {
    host: '10.0.4.50',
    port: 1502,
    unitId: 7,
    transport: 'Modbus RTU / RS-485',
    pollInterval: '10 s',
    signal: 'ALTA LAT.',
    area: 'Linha de Bombas',
    gateway: 'RTU-EDGE-07',
    registerCount: 12,
    health: 'amber'
  }
];

export const modbusVariableTemplates: ModbusVariableTemplate[] = [
  {
    id: 'temperature',
    label: 'Temperatura de Processo',
    unit: '°C',
    registerAddress: '40001',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Leitura principal de temperatura do ativo.'
  },
  {
    id: 'humidity',
    label: 'Umidade Relativa',
    unit: '%RH',
    registerAddress: '40003',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Medição ambiente para HVAC e conservação.'
  },
  {
    id: 'pressure',
    label: 'Pressão de Linha',
    unit: 'bar',
    registerAddress: '40005',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Transdutor analógico 4-20 mA convertido em Modbus.'
  },
  {
    id: 'vibration',
    label: 'Vibração RMS',
    unit: 'mm/s',
    registerAddress: '40007',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Indicador de preditiva para motores e bombas.'
  },
  {
    id: 'current',
    label: 'Corrente de Fase',
    unit: 'A',
    registerAddress: '40009',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Medição elétrica para consumo instantâneo.'
  },
  {
    id: 'voltage',
    label: 'Tensão',
    unit: 'V',
    registerAddress: '40011',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Monitoramento de alimentação do equipamento.'
  },
  {
    id: 'active-power',
    label: 'Potência Ativa',
    unit: 'kW',
    registerAddress: '40013',
    functionCode: 'FC03',
    dataType: 'float32',
    description: 'Indicador executivo para eficiência operacional.'
  },
  {
    id: 'energy',
    label: 'Energia Acumulada',
    unit: 'kWh',
    registerAddress: '40015',
    functionCode: 'FC03',
    dataType: 'uint32',
    description: 'Contador acumulado para fechamento diário.'
  }
];

export const demoAlarmList: Array<IotAlarm & { deviceName: string; registerName: string }> = [
  {
    id: 'demo-alarm-1',
    deviceId: 'demo-device-1',
    registerId: 'temperature',
    code: 'TEMP_HIGH_QGBT',
    message: 'Temperatura acima da faixa segura no painel principal.',
    severity: 'HIGH',
    status: 'OPEN',
    triggeredAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    acknowledgedAt: undefined,
    acknowledgedBy: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceName: 'Painel QGBT Sede',
    registerName: 'Temperatura'
  },
  {
    id: 'demo-alarm-2',
    deviceId: 'demo-device-2',
    registerId: 'pressure',
    code: 'PRESSURE_DROP_CP',
    message: 'Pressão abaixo do threshold na linha do compressor.',
    severity: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    triggeredAt: new Date(Date.now() - 68 * 60_000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 54 * 60_000).toISOString(),
    acknowledgedBy: 'operador.turno-a',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceName: 'Compressor Parafuso CP-01',
    registerName: 'Pressão de Linha'
  },
  {
    id: 'demo-alarm-3',
    deviceId: 'demo-device-3',
    registerId: 'vibration',
    code: 'VIB_RMS_WARN_BM',
    message: 'Tendência de vibração crescente na bomba de recirculação.',
    severity: 'LOW',
    status: 'RESOLVED',
    triggeredAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 170 * 60_000).toISOString(),
    acknowledgedBy: 'manutencao.planta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceName: 'Bomba de Recirculação BM-03',
    registerName: 'Vibração RMS'
  }
];

export const demoObservabilitySeries: DashboardTimeSeriesPoint[] = [
  { label: '00h', value: 36 },
  { label: '04h', value: 41 },
  { label: '08h', value: 44 },
  { label: '12h', value: 39 },
  { label: '16h', value: 45 },
  { label: '20h', value: 42 }
];

export const demoAlarmPressureSeries: DashboardTimeSeriesPoint[] = [
  { label: 'Seg', value: 3 },
  { label: 'Ter', value: 5 },
  { label: 'Qua', value: 2 },
  { label: 'Qui', value: 6 },
  { label: 'Sex', value: 4 },
  { label: 'Sáb', value: 1 }
];

export const demoThroughputSeries: DashboardTimeSeriesPoint[] = [
  { label: 'L1', value: 19 },
  { label: 'L2', value: 23 },
  { label: 'L3', value: 21 },
  { label: 'L4', value: 25 },
  { label: 'L5', value: 24 },
  { label: 'L6', value: 27 }
];

export const demoQuickActions = [
  {
    href: '/iot/devices',
    title: 'Dispositivos',
    description: 'Estado da frota, status de comunicação e edição operacional do parque.'
  },
  {
    href: '/iot/add-device',
    title: 'Adicionar Dispositivo',
    description: 'Cadastro guiado com semântica Modbus TCP / RS-485 e seleção de medições.'
  },
  {
    href: '/iot/alarms',
    title: 'Alarmes',
    description: 'Pressão operacional, severidade, reconhecimento e resposta rápida.'
  },
  {
    href: '/iot/observability',
    title: 'Análise Global',
    description: 'Comparativo executivo com tendência, cobertura e leitura consolidada.'
  }
];

export function getOperationalProfile(device: IotDevice, index: number) {
  const base = demoProfiles[index % demoProfiles.length];
  const health =
    device.status === 'OFFLINE'
      ? 'red'
      : device.status === 'MAINTENANCE'
        ? 'amber'
        : device.status === 'ALERT'
          ? 'amber'
          : base.health;

  return {
    ...base,
    health,
    host: device.identifier?.includes('.')
      ? device.identifier
      : base.host,
    area: device.location || base.area
  };
}

export function buildDemoDevicesFromReal(realDevices: IotDevice[]) {
  if (realDevices.length > 0) {
    return realDevices;
  }

  return [
    {
      id: 'demo-device-1',
      name: 'Painel QGBT Sede',
      identifier: 'QGBT-SEDE-01',
      serialNumber: 'QGBT-SEDE-01',
      type: 'GATEWAY',
      location: 'Subestação principal',
      description: 'Gateway Modbus para medição elétrica do quadro geral.',
      status: 'ONLINE',
      lastSeenAt: new Date(Date.now() - 2 * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-device-2',
      name: 'Compressor Parafuso CP-01',
      identifier: 'CP-01-MODBUS',
      serialNumber: 'CP-01-MODBUS',
      type: 'SENSOR',
      location: 'Casa de compressores',
      description: 'Monitoramento de pressão, corrente e vibração.',
      status: 'ALERT',
      lastSeenAt: new Date(Date.now() - 7 * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-device-3',
      name: 'Bomba de Recirculação BM-03',
      identifier: 'BM03-RTU7',
      serialNumber: 'BM03-RTU7',
      type: 'ACTUATOR',
      location: 'Linha úmida',
      description: 'Bomba crítica monitorada via RTU RS-485.',
      status: 'OFFLINE',
      lastSeenAt: new Date(Date.now() - 86 * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] satisfies IotDevice[];
}

export function buildDemoReportSummary(): IotReportSummary {
  return {
    totalDevices: 3,
    totalRegisters: 26,
    telemetryPointsLast24h: 1240,
    openAlarms: 1,
    pendingMaintenance: 2,
    devicesByStatus: {
      ONLINE: 1,
      ALERT: 1,
      OFFLINE: 1
    },
    telemetryByMetric: {
      temperatura: 320,
      pressao: 260,
      corrente: 180,
      energia: 480
    },
    alarmsByStatus: {
      OPEN: 1,
      ACKNOWLEDGED: 1,
      RESOLVED: 1
    },
    alarmsBySeverity: {
      HIGH: 1,
      MEDIUM: 1,
      LOW: 1
    },
    maintenanceByStatus: {
      PENDING: 2,
      COMPLETED: 6
    },
    generatedAt: new Date().toISOString()
  };
}
