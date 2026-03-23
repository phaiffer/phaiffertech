'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { notificationService } from '@/shared/services/notification-service';
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
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    notificationService.getSummary().then((summary) => {
      const item = summary.items.find((i) => i.key === 'inventory-low-stock');
      if (item) {
        const match = item.title.match(/^\d+/);
        setLowStockCount(match ? parseInt(match[0], 10) : 0);
      }
    }).catch(() => { /* non-critical */ });
  }, []);

  return (
    <div className={sharedPageStackClass}>
      <PageTitle
        eyebrow="Platform foundation"
        title="Inventory"
        description="Shared operational capability across all products. Inventory tracks product stock, inbound and outbound movements, and consumption across both PetFlow and IoT operations."
      />

      {lowStockCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-5 py-4">
          <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {lowStockCount} item{lowStockCount === 1 ? '' : 's'} with low stock
            </p>
            <p className="mt-0.5 text-xs text-warning/80">
              Stock levels are at or below the minimum threshold. Open the relevant inventory section to plan replenishment.
            </p>
          </div>
        </div>
      )}

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
        <p className="text-sm font-semibold text-[color:var(--app-shell-muted)]">How inventory works on this platform</p>
        <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
          Inventory is tracked per product context. PetFlow manages pharmaceutical products and retail items; IoT tracks parts and components used during maintenance. Each section shows stock levels, minimum thresholds, and movement history relevant to the respective operation.
        </p>
      </div>
    </div>
  );
}
