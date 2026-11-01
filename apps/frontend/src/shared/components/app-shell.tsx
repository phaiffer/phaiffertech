'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { Sidebar } from '@/shared/components/sidebar';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

function resolveModuleContext(pathname: string): 'core' | 'crm' | 'pet' {
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/pet')) return 'pet';
  return 'core';
}

function isAdministrativeSurface(pathname: string, canManagePlatformAdministration: boolean) {
  if (!canManagePlatformAdministration) {
    return false;
  }

  return pathname.startsWith('/tenants')
    || pathname.startsWith('/users')
    || pathname.startsWith('/settings');
}

function resolveHeaderLabel(
  pathname: string,
  labels: ReturnType<typeof useAppMessages>['appShell']['header'],
  platformAdmin?: boolean,
  hasPetVisible?: boolean
) {
  if (pathname.startsWith('/crm')) return labels.crmLabel;
  if (pathname.startsWith('/pet')) return labels.petLabel;
  if (pathname.startsWith('/tenants')) return labels.workspacesLabel;
  if (pathname.startsWith('/users')) return labels.usersLabel;
  if (pathname.startsWith('/settings')) return labels.settingsLabel;
  if (platformAdmin) return labels.platformLabel;
  return hasPetVisible ? labels.petOverviewLabel : labels.overviewLabel;
}

// Marks the document as an app surface while the shell is mounted, so portaled
// menus and dialogs (rendered under <body>) also get the Comanda v2 tokens.
function useAppSurfaceOnBody() {
  useEffect(() => {
    const body = document.body;
    const previous = body.dataset.surface;
    body.dataset.surface = 'app';
    return () => {
      if (previous) {
        body.dataset.surface = previous;
      } else {
        delete body.dataset.surface;
      }
    };
  }, []);
}

// Comanda v2 app shell: light sidebar + content. Desktop has no top bar (each page
// renders its own header); below 900px a compact bar opens the sidebar as a drawer.
export function AppShell({ children }: { children: ReactNode }) {
  const copy = useAppMessages().screens.shell;
  const messages = useAppMessages().appShell;
  const pathname = usePathname();
  const { branding, modules, workspace } = useFrontendPlatform();
  const hasPetVisible = modules.availableCodes.includes('PET');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useAppSurfaceOnBody();

  // Close the drawer when the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const moduleContext = useMemo(() => resolveModuleContext(pathname), [pathname]);
  const headerLabel = useMemo(
    () => resolveHeaderLabel(pathname, messages.header, workspace.canManagePlatformAdministration, hasPetVisible),
    [hasPetVisible, messages.header, pathname, workspace.canManagePlatformAdministration]
  );

  // Tenant branding variables stay available to components; in v2 the accent is ink.
  const shellStyle = useMemo(
    () =>
      ({
        ...branding.style,
        '--tenant-accent': 'var(--ink)',
        '--tenant-accent-soft': 'var(--selected)',
        '--tenant-primary': 'var(--ink)',
        '--tenant-primary-soft': 'var(--selected)'
      }) as CSSProperties,
    [branding.style]
  );
  const showAdministrativeSignature = useMemo(
    () => isAdministrativeSurface(pathname, workspace.canManagePlatformAdministration),
    [pathname, workspace.canManagePlatformAdministration]
  );

  return (
    <div
      className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)] nav:h-screen nav:overflow-hidden"
      data-module={moduleContext}
      data-surface="app"
      style={shellStyle}
    >
      <Sidebar mobileOpen={drawerOpen} onNavigate={() => setDrawerOpen(false)} />

      {drawerOpen ? (
        <button
          type="button"
          aria-label={copy.closeMenu}
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-[rgb(28_28_26/0.4)] nav:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col nav:overflow-hidden">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-[color:var(--line)] bg-[var(--bg)] px-3 nav:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={copy.openMenu}
            aria-controls="app-sidebar"
            aria-expanded={drawerOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--ink)] hover:bg-[var(--selected)]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="truncate text-sm font-semibold">{headerLabel}</span>
        </header>

        {showAdministrativeSignature ? (
          <div className="border-b border-[color:var(--line)] bg-[var(--bg-row)] px-4 py-2 text-[13px] text-[var(--ink-2)] nav:px-6">
            <span className="font-semibold text-[var(--ink)]">{copy.adminTitle}</span>
            {' · '}
            {copy.adminSignature} <span className="font-medium text-[var(--ink)]">PhaifferTech</span>.
          </div>
        ) : null}

        <main className="flex-1 px-4 py-4 nav:overflow-auto nav:px-6 nav:py-5">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--line)] pt-3 text-xs text-[var(--muted)]">
              <span>{messages.mobilePetWorkspace}</span>
              <span>by PhaifferTech</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
