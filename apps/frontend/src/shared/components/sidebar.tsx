'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PawPrint,
  Users,
  Calendar,
  FileText,
  Syringe,
  DollarSign,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/shared/auth/use-auth';
import { BrandMark } from '@/shared/components/brand-assets';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

type SidebarItem = {
  href: string;
  label: string;
  icon: ReactNode;
  group: 'main' | 'gestao' | 'financeiro';
};

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const messages = useAppMessages().sidebar;
  const { branding, workspace } = useFrontendPlatform();

  const items: SidebarItem[] = useMemo(() => [
    // Main
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, group: 'main' },
    // Gestao
    { href: '/pet/pacientes', label: 'Pacientes', icon: <PawPrint className="h-5 w-5" />, group: 'gestao' },
    { href: '/pet/tutores', label: 'Tutores', icon: <Users className="h-5 w-5" />, group: 'gestao' },
    { href: '/pet/agendamentos', label: 'Agendamentos', icon: <Calendar className="h-5 w-5" />, group: 'gestao' },
    { href: '/pet/prontuarios', label: 'Prontuarios', icon: <FileText className="h-5 w-5" />, group: 'gestao' },
    { href: '/pet/vacinas', label: 'Vacinas', icon: <Syringe className="h-5 w-5" />, group: 'gestao' },
    // Financeiro
    { href: '/pet/faturamento', label: 'Faturamento', icon: <DollarSign className="h-5 w-5" />, group: 'financeiro' },
  ], []);

  const mainItems = items.filter((item) => item.group === 'main');
  const gestaoItems = items.filter((item) => item.group === 'gestao');
  const financeiroItems = items.filter((item) => item.group === 'financeiro');

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-white lg:flex">
      {/* Logo */}
      <div className="border-b border-border px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="h-10 w-10 shrink-0" imageClassName="scale-[1.08]" />
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-[-0.02em] text-foreground">PetFlow</p>
            <p className="text-[10px] font-medium text-petflow">by PhaifferTech</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {/* Main Items */}
          <div className="space-y-1">
            {mainItems.map((item) => {
              const active = isItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-petflow text-white shadow-sm shadow-petflow/20'
                      : 'text-muted hover:bg-slate-50 hover:text-foreground'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-muted-foreground'}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Gestao Group */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Gestao
            </p>
            <div className="space-y-1">
              {gestaoItems.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-petflow text-white shadow-sm shadow-petflow/20'
                        : 'text-muted hover:bg-slate-50 hover:text-foreground'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-muted-foreground'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Financeiro Group */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Financeiro
            </p>
            <div className="space-y-1">
              {financeiroItems.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-petflow text-white shadow-sm shadow-petflow/20'
                        : 'text-muted hover:bg-slate-50 hover:text-foreground'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-muted-foreground'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Footer - Workspace Card */}
      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-petflow/5 p-3">
          <p className="text-sm font-semibold text-petflow">{branding.scopeName || 'Clinica VetCare'}</p>
          <p className="mt-0.5 text-xs text-muted">{workspace.accessLabel || 'Plano Professional'}</p>
        </div>
        
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-muted transition-colors hover:border-destructive hover:bg-destructive-muted hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{messages.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
