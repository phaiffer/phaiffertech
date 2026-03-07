'use client';

import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PageTitle } from '@/shared/ui/page-title';

const controlPlaneCards = [
  {
    href: '/iot/devices',
    title: 'Devices',
    description: 'Cadastro do parque instalado, status operacional e última comunicação.',
    permission: 'iot.device.read'
  },
  {
    href: '/iot/registers',
    title: 'Registers',
    description: 'Canais lógicos de leitura e escrita por dispositivo, com thresholds básicos.',
    permission: 'iot.register.read'
  },
  {
    href: '/iot/maintenance',
    title: 'Maintenance',
    description: 'Planejamento e execução de ordens operacionais por device.',
    permission: 'iot.maintenance.read'
  }
];

const dataPlaneCards = [
  {
    href: '/iot/dashboard',
    title: 'Dashboard',
    description: 'Resumo comercial do tenant com devices, alarmes, manutenção e telemetria recente.',
    permission: 'iot.dashboard.read'
  },
  {
    href: '/iot/telemetry',
    title: 'Telemetry',
    description: 'Ingestão básica, consulta paginada e filtros por device, register e período.',
    permission: 'iot.telemetry.read'
  },
  {
    href: '/iot/alarms',
    title: 'Alarms',
    description: 'Eventos operacionais, severidade, acknowledge e acompanhamento por register.',
    permission: 'iot.alarm.read'
  },
  {
    href: '/iot/reports',
    title: 'Reports',
    description: 'Visão agregada do tenant para operação comercial e acompanhamento executivo.',
    permission: 'iot.report.read'
  }
];

function IotCard({
  href,
  title,
  description
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-action hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action">IoT V1</p>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-4 inline-flex text-sm font-medium text-action transition group-hover:translate-x-1">Abrir</span>
    </Link>
  );
}

export function IotHome() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="IoT Module"
        description="IoT V1 comercial separado entre control plane e data plane, usando o legado como referência e mantendo a arquitetura modular da plataforma."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Arquitetura</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Control Plane</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Devices, registers e maintenance ficam no plano de controle para configuração, operação diária e governança do tenant.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Data Plane</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Telemetry, alarm evaluation, dashboard e reports usam abstrações do módulo para evitar acoplamento rígido com o storage atual.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Control Plane</h2>
          <p className="mt-1 text-sm text-slate-600">Configuração operacional e cadastro do parque IoT.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {controlPlaneCards.map((item) => (
            <PermissionGuard key={item.href} permission={item.permission}>
              <IotCard href={item.href} title={item.title} description={item.description} />
            </PermissionGuard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Data Plane</h2>
          <p className="mt-1 text-sm text-slate-600">Operação em tempo quase real com visão resumida para uso comercial.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dataPlaneCards.map((item) => (
            <PermissionGuard key={item.href} permission={item.permission}>
              <IotCard href={item.href} title={item.title} description={item.description} />
            </PermissionGuard>
          ))}
        </div>
      </section>
    </div>
  );
}
