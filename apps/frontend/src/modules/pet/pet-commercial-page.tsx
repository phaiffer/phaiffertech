'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { PetCommercialDealsPage } from '@/modules/pet/pet-commercial-deals-page';
import { PetCommercialLeadsPage } from '@/modules/pet/pet-commercial-leads-page';
import { PetCommercialPipelinePage } from '@/modules/pet/pet-commercial-pipeline-page';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import {
  petCommercialTabPermissions,
  type PetCommercialTabKey
} from '@/shared/auth/pet-commercial-permissions';
import { usePermissions } from '@/shared/auth/usePermissions';

const commercialTabs: Array<{ key: PetCommercialTabKey; label: string; permission: string }> = [
  { key: 'leads', label: 'Leads', permission: petCommercialTabPermissions.leads },
  { key: 'deals', label: 'Negócios', permission: petCommercialTabPermissions.deals },
  { key: 'pipeline', label: 'Pipeline', permission: petCommercialTabPermissions.pipeline }
];

function buildTabHref(pathname: string, key: PetCommercialTabKey) {
  return key === 'leads' ? pathname : `${pathname}?tab=${key}`;
}

export function PetCommercialPage() {
  const { hasPermission } = usePermissions();
  const pathname = usePathname() ?? '/pet/commercial';
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const visibleTabs = commercialTabs.filter((tab) => hasPermission(tab.permission));
  const activeTab = visibleTabs.find((tab) => tab.key === requestedTab) ?? visibleTabs[0] ?? null;

  return (
    <div className="space-y-5">
      <PetModuleSubnav />

      {activeTab ? (
        <>
          <section className="ui-surface-panel space-y-4 p-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                PetFlow commercial
              </p>
              <p className="max-w-3xl text-sm text-[color:var(--app-shell-muted)]">
                Leads, negócios e pipeline entram pelo PetFlow como uma capacidade comercial única. A infraestrutura
                legada continua por baixo apenas como camada temporária de compatibilidade enquanto a consolidação
                avança com segurança.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {visibleTabs.map((tab) => {
                const active = tab.key === activeTab.key;

                return (
                  <Link
                    key={tab.key}
                    href={buildTabHref(pathname, tab.key)}
                    className={`inline-flex h-10 items-center rounded-[1rem] px-3.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-white shadow-sm'
                        : 'border border-[color:var(--app-shell-border)] bg-white text-[color:var(--app-shell-heading)] hover:bg-[color:var(--app-shell-panel-muted)]'
                    }`}
                    style={active ? { background: 'var(--accent)' } : undefined}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {activeTab.key === 'leads' ? <PetCommercialLeadsPage /> : null}
          {activeTab.key === 'deals' ? <PetCommercialDealsPage /> : null}
          {activeTab.key === 'pipeline' ? <PetCommercialPipelinePage /> : null}
        </>
      ) : (
        <div className="ui-notice-warning">Você não possui permissão para visualizar o comercial do PetFlow.</div>
      )}
    </div>
  );
}
