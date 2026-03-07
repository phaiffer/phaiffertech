'use client';

import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PageTitle } from '@/shared/ui/page-title';

export function PetHome() {
  return (
    <div className="space-y-5">
      <PageTitle title="Pet Module" description="Operações do módulo PET: clientes, pets e agenda de atendimentos." />

      <div className="grid gap-4 md:grid-cols-4">
        <PermissionGuard permission="pet.dashboard.read">
          <Link
            href="/pet/dashboard"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Dashboard</h3>
            <p className="mt-2 text-sm text-slate-600">Visão executiva e operacional da clínica e do comercial.</p>
          </Link>
        </PermissionGuard>

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

        <PermissionGuard permission="pet.service.read">
          <Link
            href="/pet/services"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Services</h3>
            <p className="mt-2 text-sm text-slate-600">Catálogo de serviços comercializados pelo tenant.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.professional.read">
          <Link
            href="/pet/professionals"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Professionals</h3>
            <p className="mt-2 text-sm text-slate-600">Gestão da equipe clínica e operacional.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.medical-record.read">
          <Link
            href="/pet/medical-records"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Medical Records</h3>
            <p className="mt-2 text-sm text-slate-600">Prontuários, vacinas e prescrições por pet.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.product.read">
          <Link
            href="/pet/products"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Products</h3>
            <p className="mt-2 text-sm text-slate-600">Produtos, SKUs e pricing do módulo comercial.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.inventory.read">
          <Link
            href="/pet/inventory"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Inventory</h3>
            <p className="mt-2 text-sm text-slate-600">Movimentações de estoque com trilha operacional.</p>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission="pet.invoice.read">
          <Link
            href="/pet/invoices"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
          >
            <h3 className="text-sm font-semibold text-slate-900">Pet Invoices</h3>
            <p className="mt-2 text-sm text-slate-600">Faturamento básico por cliente no Pet V1.</p>
          </Link>
        </PermissionGuard>
      </div>
    </div>
  );
}
