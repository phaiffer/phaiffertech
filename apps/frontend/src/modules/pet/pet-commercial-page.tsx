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
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

function buildTabHref(pathname: string, key: PetCommercialTabKey) {
  return key === 'leads' ? pathname : `${pathname}?tab=${key}`;
}

export function PetCommercialPage() {
  const copy = useAppMessages().screens.petCommercial;
  const { hasPermission } = usePermissions();
  const pathname = usePathname() ?? '/pet/commercial';
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const commercialTabs: Array<{ key: PetCommercialTabKey; label: string; permission: string }> = [
    { key: 'leads', label: copy.tabLeads, permission: petCommercialTabPermissions.leads },
    { key: 'deals', label: copy.tabDeals, permission: petCommercialTabPermissions.deals },
    { key: 'pipeline', label: copy.tabStages, permission: petCommercialTabPermissions.pipeline }
  ];
  const visibleTabs = commercialTabs.filter((tab) => hasPermission(tab.permission));
  const activeTab = visibleTabs.find((tab) => tab.key === requestedTab) ?? visibleTabs[0] ?? null;

  return (
    <div className={sharedPageStackClass}>
      <PetModuleSubnav />

      {activeTab ? (
        <>
          <nav aria-label={copy.tabsLabel} className="flex gap-4 overflow-x-auto overflow-y-hidden border-b border-[color:var(--line)]">
            {visibleTabs.map((tab) => {
              const active = tab.key === activeTab.key;

              return (
                <Link
                  key={tab.key}
                  href={buildTabHref(pathname, tab.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`-mb-px whitespace-nowrap border-b-2 py-2 text-sm ${
                    active
                      ? 'border-[color:var(--ink)] font-medium text-[var(--ink)]'
                      : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {activeTab.key === 'leads' ? <PetCommercialLeadsPage /> : null}
          {activeTab.key === 'deals' ? <PetCommercialDealsPage /> : null}
          {activeTab.key === 'pipeline' ? <PetCommercialPipelinePage /> : null}
        </>
      ) : (
        <div className="ui-notice-warning">{copy.noPermission}</div>
      )}
    </div>
  );
}
