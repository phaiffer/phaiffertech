'use client';

import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PageTitle } from '@/shared/ui/page-title';

export function IotHome() {
  return (
    <div className="space-y-5">
      <PageTitle title="IoT Module" description="Control plane e data plane com dispositivos, alarmes e telemetria." />

      <div className="grid gap-4 md:grid-cols-3">
        <PermissionGuard permission="iot.device.read">
          <Link
            href="/iot/devices"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Devices</h3>
            <p className="mt-2 text-sm text-slate-600">Cadastro e manutenção de dispositivos IoT.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="iot.alarm.read">
          <Link
            href="/iot/alarms"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Alarms</h3>
            <p className="mt-2 text-sm text-slate-600">Eventos, severidade e reconhecimento de alarmes.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="iot.telemetry.read">
          <Link
            href="/iot/telemetry"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Telemetry</h3>
            <p className="mt-2 text-sm text-slate-600">Ingestão e consulta paginada de métricas.</p>
          </Link>
        </PermissionGuard>
      </div>
    </div>
  );
}
