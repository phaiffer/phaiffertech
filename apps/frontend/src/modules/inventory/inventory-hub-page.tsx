'use client';

import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { PageTitle } from '@/shared/ui/page-title';

/* ─── Inventory Hub ──────────────────────────────────────────────────────────
 * Inventory is a shared operational capability used across PetFlow and IoT.
 * This page surfaces the relevant inventory entry points based on the user's
 * permissions, making it clear that inventory is a platform foundation rather
 * than a feature of any single product.
 * ─────────────────────────────────────────────────────────────────────────── */

type InventorySurfaceCardProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

function InventorySurfaceCard({ title, description, href, label }: InventorySurfaceCardProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-surface)] p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-[color:var(--app-shell-heading)]">{title}</h3>
        <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
      </div>
      <Link href={href} className="ui-secondary-button self-start text-sm">
        {label}
      </Link>
    </div>
  );
}

export function InventoryHubPage() {
  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        eyebrow="Platform foundation"
        title="Inventory"
        description="Shared operational capability across all products. Inventory tracks product stock, inbound and outbound movements, and consumption across both PetFlow and IoT operations."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <PermissionGuard permission="pet.inventory.read">
          <InventorySurfaceCard
            title="PetFlow — Products & Stock"
            description="Manage product catalog and stock movements for retail, clinics, and grooming operations. Includes inbound supply and outbound sales."
            href="/pet/inventory"
            label="Go to PetFlow Inventory"
          />
        </PermissionGuard>

        <PermissionGuard permission="iot.part.read">
          <InventorySurfaceCard
            title="IoT System — Parts & Components"
            description="Track parts and components used in device maintenance and field operations. Supports consumption logging and replenishment visibility."
            href="/iot/parts"
            label="Go to IoT Parts"
          />
        </PermissionGuard>
      </div>

      <div className="rounded-2xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-6">
        <p className="text-sm font-medium text-[color:var(--app-shell-muted)]">
          Inventory is managed per product context. Future versions will consolidate cross-product stock views here.
        </p>
      </div>
    </div>
  );
}
