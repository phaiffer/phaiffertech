'use client';

import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PageTitle } from '@/shared/ui/page-title';

export function PetHome() {
  return (
    <div className="space-y-5">
      <PageTitle title="Pet Module" description="Operações do módulo PET: clientes, pets e agenda de atendimentos." />

      <div className="grid gap-4 md:grid-cols-3">
        <PermissionGuard permission="pet.client.read">
          <Link
            href="/pet/clients"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Clients</h3>
            <p className="mt-2 text-sm text-slate-600">Cadastro e gestão de clientes do tenant.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.profile.read">
          <Link
            href="/pet/pets"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Profiles</h3>
            <p className="mt-2 text-sm text-slate-600">Perfis de pets vinculados aos clientes.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.appointment.read">
          <Link
            href="/pet/appointments"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Appointments</h3>
            <p className="mt-2 text-sm text-slate-600">Agenda de atendimentos e serviços.</p>
          </Link>
        </PermissionGuard>
      </div>
    </div>
  );
}
