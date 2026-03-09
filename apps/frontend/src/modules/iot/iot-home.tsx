'use client';

import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  IotActionButton,
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
  const guidedFlows = demoQuickActions.length + 1;

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
          title="Centro operacional do IoT"
          description="Entrada do módulo para percorrer a narrativa completa da entrega: dashboard, frota conectada, onboarding Modbus, mapeamento, stream operacional, alarmes, manutenção e observabilidade."
          chips={
            <>
              <Chip label="Fluxos guiados" value={guidedFlows} tone="green" icon={<DeviceIcon />} />
              <Chip label="Linguagem" value="industrial dark" tone="cyan" icon={<WaveIcon />} />
            </>
          }
          action={<IotActionButton href="/iot/dashboard">Abrir dashboard</IotActionButton>}
          aside={
            <IotHeroAside
              title="Narrativa da Entrega"
              items={[
                { label: 'Entrada', value: 'Dashboard e frota', tone: 'green' },
                { label: 'Camada técnica', value: 'Modbus, registradores e stream', tone: 'cyan' },
                { label: 'Fechamento', value: 'Alarmes, manutenção e observabilidade', tone: 'amber' }
              ]}
            />
          }
        />

        <IotPanel
          title="Fluxos priorizados para apresentação"
          description="Os acessos abaixo mantêm a sequência operacional do módulo sem sair da arquitetura consolidada nesta entrega."
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
