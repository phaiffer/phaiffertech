'use client';

import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  Chip,
  DeviceIcon,
  IotHeroAside,
  IotPageHeader,
  IotPanel,
  IotSurfaceLink,
  WaveIcon
} from '@/modules/iot/iot-chrome';
import { demoQuickActions } from '@/modules/iot/iot-demo-data';

export function IotHome() {
  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para abrir o overview do IoT System.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="IoT System"
          title="Hub Operacional do IoT"
          description="Landing curta do módulo para acessar rapidamente os fluxos que foram priorizados para demo: dashboard, gestão de dispositivos, onboarding Modbus, alarmes e análise global."
          chips={
            <>
              <Chip label="Demo ready" value="5 fluxos" tone="green" icon={<DeviceIcon />} />
              <Chip label="Visual" value="industrial dark" tone="cyan" icon={<WaveIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Recorte Atual"
              items={[
                { label: 'Prioridade', value: 'Dashboard + Frota', tone: 'green' },
                { label: 'Onboarding', value: 'Modbus demo', tone: 'amber' },
                { label: 'Narrativa', value: 'Executiva / operacional', tone: 'cyan' }
              ]}
            />
          }
        />

        <IotPanel
          title="Painéis priorizados"
          description="Esses são os pontos do produto ajustados para o patamar visual aprovado pelo cliente nesta etapa."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {demoQuickActions.map((action) => (
              <IotSurfaceLink
                key={action.href}
                href={action.href}
                title={action.title}
                description={action.description}
              />
            ))}
          </div>
        </IotPanel>
      </div>
    </PermissionGuard>
  );
}
