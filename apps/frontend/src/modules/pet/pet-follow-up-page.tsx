'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CrmActivityPage } from '@/modules/crm/activity-page';
import { CrmNotesPage } from '@/modules/crm/notes-page';
import { CrmTasksPage } from '@/modules/crm/tasks-page';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { usePermissions } from '@/shared/auth/usePermissions';

type FollowUpTabKey = 'tasks' | 'notes' | 'activity';

const followUpTabs: Array<{ key: FollowUpTabKey; label: string; permission: string }> = [
  { key: 'tasks', label: 'Tarefas', permission: 'crm.task.read' },
  { key: 'notes', label: 'Notas', permission: 'crm.note.read' },
  { key: 'activity', label: 'Atividade', permission: 'crm.activity.read' }
];

function buildTabHref(pathname: string, key: FollowUpTabKey) {
  return key === 'tasks' ? pathname : `${pathname}?tab=${key}`;
}

export function PetFollowUpPage() {
  const { hasPermission } = usePermissions();
  const pathname = usePathname() ?? '/pet/follow-up';
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const visibleTabs = followUpTabs.filter((tab) => hasPermission(tab.permission));
  const activeTab = visibleTabs.find((tab) => tab.key === requestedTab) ?? visibleTabs[0] ?? null;

  return (
    <div className="space-y-5">
      <PetModuleSubnav />

      {activeTab ? (
        <>
          <section className="ui-surface-panel space-y-4 p-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                PetFlow follow-up
              </p>
              <p className="max-w-3xl text-sm text-[color:var(--app-shell-muted)]">
                Tarefas, notas e trilha de atividade agora entram pela navegação do PetFlow. Os endpoints de CRM
                continuam por baixo apenas como camada temporária de compatibilidade nesta etapa da absorção.
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

          {activeTab.key === 'tasks' ? <CrmTasksPage surface="pet" /> : null}
          {activeTab.key === 'notes' ? <CrmNotesPage surface="pet" /> : null}
          {activeTab.key === 'activity' ? <CrmActivityPage surface="pet" /> : null}
        </>
      ) : (
        <div className="ui-notice-warning">Você não possui permissão para visualizar o follow-up do PetFlow.</div>
      )}
    </div>
  );
}
