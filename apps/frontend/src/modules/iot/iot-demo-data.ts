import { DashboardTimeSeriesPoint } from '@/shared/types/dashboard';
import {
  IotAlarm,
  IotDevice,
  IotMaintenance,
  IotRegister,
  IotReportSummary,
  IotTelemetryRecord
} from '@/shared/types/iot';

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

export type ModbusMappingDetails = {
  functionCode: string;
  registerAddress: string;
  dataType: string;
  unit?: string;
  template?: ModbusVariableTemplate;
};

export type DemoTelemetryRecord = IotTelemetryRecord & {
  deviceName: string;
  registerName: string;
  quality: 'GOOD' | 'WARN' | 'STALE';
  functionCode: string;
  registerAddress: string;
};

export type DemoMaintenanceRecord = IotMaintenance & {
  deviceName: string;
  trigger: string;
  linkedAlarmCode: string;
  ownerLabel: string;
  shift: string;
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

export function resolveModbusVariableTemplate(
  metricName?: string,
  registerName?: string,
  code?: string
) {
  const haystack = [metricName, registerName, code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return modbusVariableTemplates.find((template) => {
    const terms = [
      template.id,
      template.label,
      template.description,
      template.unit,
      template.registerAddress
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(template.id) || haystack.includes(template.registerAddress) || terms.split(' ').some((term) => term && haystack.includes(term));
  });
}

function inferFunctionCodeFromAddress(registerAddress: string) {
  if (registerAddress.startsWith('3')) {
    return 'FC04';
  }

  if (registerAddress.startsWith('1')) {
    return 'FC02';
  }

  if (registerAddress.startsWith('0')) {
    return 'FC01';
  }

  return 'FC03';
}

export function buildModbusCode(functionCode: string, registerAddress: string) {
  return `${functionCode}:${registerAddress}`;
}

export function parseModbusMapping(
  code?: string,
  metricName?: string,
  registerName?: string,
  fallbackDataType?: string,
  fallbackUnit?: string
): ModbusMappingDetails {
  const template = resolveModbusVariableTemplate(metricName, registerName, code);
  const functionMatch = code?.match(/FC\d{2}/i);
  const addressMatch = code?.match(/\d{4,6}/);
  const registerAddress = addressMatch?.[0] ?? template?.registerAddress ?? '40001';
  const functionCode =
    functionMatch?.[0]?.toUpperCase() ?? template?.functionCode ?? inferFunctionCodeFromAddress(registerAddress);

  return {
    functionCode,
    registerAddress,
    dataType: template?.dataType ?? fallbackDataType ?? 'float32',
    unit: template?.unit ?? fallbackUnit,
    template
  };
}

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

export function buildDemoRegisters(devices: IotDevice[]) {
  const sourceDevices = buildDemoDevicesFromReal(devices);
  const now = new Date().toISOString();

  return sourceDevices.flatMap((device, deviceIndex) =>
    modbusVariableTemplates.slice(0, 4).map((template, templateIndex) => ({
      id: `${device.id}-reg-${template.id}`,
      deviceId: device.id,
      name: `${template.label} ${deviceIndex + 1}`,
      code: buildModbusCode(template.functionCode, String(Number(template.registerAddress) + templateIndex * 2)),
      metricName: template.label,
      unit: template.unit,
      dataType: template.dataType.toUpperCase(),
      minThreshold: template.id === 'temperature' ? 5 : undefined,
      maxThreshold:
        template.id === 'temperature'
          ? 28
          : template.id === 'pressure'
            ? 9
            : template.id === 'current'
              ? 120
              : undefined,
      status: device.status === 'OFFLINE' ? 'INACTIVE' : 'ACTIVE',
      createdAt: now,
      updatedAt: now
    }))
  ) satisfies IotRegister[];
}

export function buildDemoTelemetryRecords(
  devices: IotDevice[],
  registers: IotRegister[]
): DemoTelemetryRecord[] {
  const sourceDevices = buildDemoDevicesFromReal(devices);
  const sourceRegisters = registers.length > 0 ? registers : buildDemoRegisters(sourceDevices);

  return sourceRegisters.slice(0, 8).map((register, index) => {
    const device = sourceDevices.find((item) => item.id === register.deviceId) ?? sourceDevices[0];
    const mapping = parseModbusMapping(register.code, register.metricName, register.name, register.dataType, register.unit);
    const metricValue = [22.6, 54.1, 6.4, 3.2, 48.3, 381.0, 72.5, 1290][index % 8];
    const quality = index % 5 === 0 ? 'WARN' : index % 7 === 0 ? 'STALE' : 'GOOD';

    return {
      id: `demo-telemetry-${register.id}`,
      deviceId: register.deviceId,
      registerId: register.id,
      metricName: register.metricName,
      metricValue,
      unit: register.unit,
      metadata: {
        functionCode: mapping.functionCode,
        registerAddress: mapping.registerAddress,
        quality,
        source: device.type ?? 'SENSOR'
      },
      recordedAt: new Date(Date.now() - index * 6 * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      deviceName: device.name,
      registerName: register.name,
      quality,
      functionCode: mapping.functionCode,
      registerAddress: mapping.registerAddress
    };
  });
}

export function buildDemoMaintenanceRecords(devices: IotDevice[]): DemoMaintenanceRecord[] {
  const sourceDevices = buildDemoDevicesFromReal(devices);
  const now = Date.now();

  return [
    {
      id: 'demo-maint-1',
      deviceId: sourceDevices[1]?.id ?? sourceDevices[0].id,
      title: 'Inspecionar transdutor de pressão',
      description: 'Oscilação contínua no registro de pressão com alarme intermitente.',
      status: 'PENDING',
      priority: 'HIGH',
      scheduledAt: new Date(now + 2 * 60 * 60_000).toISOString(),
      completedAt: undefined,
      assignedUserId: 'time-campo-a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceName: sourceDevices[1]?.name ?? sourceDevices[0].name,
      trigger: 'Queda de pressão + alarme ACKNOWLEDGED',
      linkedAlarmCode: 'PRESSURE_DROP_CP',
      ownerLabel: 'Equipe Campo A',
      shift: 'Turno 2'
    },
    {
      id: 'demo-maint-2',
      deviceId: sourceDevices[2]?.id ?? sourceDevices[0].id,
      title: 'Revalidar comunicação RS-485',
      description: 'Ativo sem heartbeat e com gateway em latência elevada.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      scheduledAt: new Date(now - 30 * 60_000).toISOString(),
      completedAt: undefined,
      assignedUserId: 'time-eletrica',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceName: sourceDevices[2]?.name ?? sourceDevices[0].name,
      trigger: 'Heartbeat interrompido',
      linkedAlarmCode: 'VIB_RMS_WARN_BM',
      ownerLabel: 'Equipe Elétrica',
      shift: 'Turno 1'
    },
    {
      id: 'demo-maint-3',
      deviceId: sourceDevices[0].id,
      title: 'Calibrar medição de temperatura',
      description: 'Ajuste preventivo concluído após tendência de alta no painel principal.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      scheduledAt: new Date(now - 26 * 60 * 60_000).toISOString(),
      completedAt: new Date(now - 23 * 60 * 60_000).toISOString(),
      assignedUserId: 'metrologia-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceName: sourceDevices[0].name,
      trigger: 'Preventiva programada',
      linkedAlarmCode: 'TEMP_HIGH_QGBT',
      ownerLabel: 'Metrologia 01',
      shift: 'Janela noturna'
    }
  ];
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
