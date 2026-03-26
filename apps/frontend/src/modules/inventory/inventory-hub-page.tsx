'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { notificationService } from '@/shared/services/notification-service';
import { PageTitle } from '@/shared/ui/page-title';

/* ─── Inventory Hub ──────────────────────────────────────────────────────────
 * The visible inventory surface is intentionally focused on PetFlow for the
 * current demo cycle. Shared foundations remain intact under the hood.
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
        eyebrow="PetFlow operations"
        title="Inventory"
        description="Inventory keeps stock, replenishment, and movement history visible for the PetFlow demo without inflating the visible product surface."
      />

      {lowStockCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-5 py-4">
          <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {lowStockCount} item{lowStockCount === 1 ? '' : 's'} with low stock
            </p>
            <p className="mt-0.5 text-xs text-warning/80">
              Stock levels are at or below the minimum threshold. Open PetFlow inventory to plan replenishment before service delivery is affected.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-1">
        <PermissionGuard permission="pet.inventory.read">
          <InventorySurfaceCard
            title="PetFlow — Products & Stock"
            description="Manage product catalog and stock movements for retail, clinics, and grooming operations. Includes inbound supply and outbound sales."
            href="/pet/inventory"
            label="Go to PetFlow Inventory"
          />
        </PermissionGuard>
      </div>

      <div className="rounded-2xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-6">
        <p className="text-sm font-semibold text-[color:var(--app-shell-muted)]">How inventory works on this platform</p>
        <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
          Inventory stays readable when operators can answer three questions quickly: what is low, what moved, and why it changed. The PetFlow demo keeps those answers visible for products, retail items, and grooming supplies.
        </p>
      </div>
    </div>
  );
}
