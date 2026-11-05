'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CrmActivityPage } from '@/modules/crm/activity-page';
import { CrmNotesPage } from '@/modules/crm/notes-page';
import { CrmTasksPage } from '@/modules/crm/tasks-page';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { PageTitle } from '@/shared/ui/page-title';

type FollowUpTabKey = 'tasks' | 'notes' | 'activity';

const followUpTabs: Array<{ key: FollowUpTabKey; permission: string }> = [
  { key: 'tasks', permission: 'crm.task.read' },
  { key: 'notes', permission: 'crm.note.read' },
  { key: 'activity', permission: 'crm.activity.read' }
];

function buildTabHref(pathname: string, key: FollowUpTabKey) {
  return key === 'tasks' ? pathname : `${pathname}?tab=${key}`;
}

export function PetFollowUpPage() {
  const copy = useAppMessages().screens.petFollowUp;
  const { hasPermission } = usePermissions();
  const pathname = usePathname() ?? '/pet/follow-up';
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const visibleTabs = followUpTabs.filter((tab) => hasPermission(tab.permission));
  const activeTab = visibleTabs.find((tab) => tab.key === requestedTab) ?? visibleTabs[0] ?? null;

  return (
    <div className="space-y-4">
      <PetModuleSubnav />

      {activeTab ? (
        <>
          <PageTitle title={copy.title} description={copy.description} />
          <nav aria-label={copy.tabsLabel} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[color:var(--line)]">
              {visibleTabs.map((tab) => {
                const active = tab.key === activeTab.key;

                return (
                  <Link
                    key={tab.key}
                    href={buildTabHref(pathname, tab.key)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
                      active
                        ? 'border-[color:var(--ink)] text-[var(--ink)]'
                        : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {copy.tabs[tab.key]}
                  </Link>
                );
              })}
          </nav>

          {activeTab.key === 'tasks' ? <CrmTasksPage /> : null}
          {activeTab.key === 'notes' ? <CrmNotesPage /> : null}
          {activeTab.key === 'activity' ? <CrmActivityPage /> : null}
        </>
      ) : (
        <div className="ui-notice-warning">{copy.noPermission}</div>
      )}
    </div>
  );
}
