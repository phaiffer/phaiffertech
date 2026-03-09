'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/shared/components/sidebar';
import { useAuth } from '@/shared/auth/use-auth';

type ThemeMode = 'dark' | 'light' | 'system';
type StyleMode = 'modern' | 'classic';

function resolveScopeName(email?: string, tenantId?: string) {
  const normalized = `${email ?? ''} ${tenantId ?? ''}`.toLowerCase();

  if (normalized.includes('phaiffer')) {
    return 'Phaiffer Industrial';
  }

  if (normalized.includes('innotech')) {
    return 'InnoTech Solutions';
  }

  return tenantId ? `Tenant ${tenantId.slice(0, 8)}` : 'Escopo Industrial';
}

function ShellToggle({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
        active
          ? 'border border-cyan-400/45 bg-cyan-400/18 text-white'
          : 'text-slate-400 hover:text-slate-200'
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function resolveHeaderMeta(pathname: string) {
  if (pathname.startsWith('/iot')) {
    return {
      label: 'Industrial IoT',
      description: 'Centro operacional para monitoramento, alarmes e cadastro de ativos.'
    };
  }

  if (pathname.startsWith('/crm')) {
    return {
      label: 'CRM',
      description: 'Operação comercial da plataforma.'
    };
  }

  if (pathname.startsWith('/pet')) {
    return {
      label: 'Pet',
      description: 'Operação do módulo vertical pet.'
    };
  }

  return {
    label: 'Control Plane',
    description: 'Gestão central da plataforma PhaifferTech.'
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [styleMode, setStyleMode] = useState<StyleMode>('modern');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('app-shell-theme');
    const savedStyle = window.localStorage.getItem('app-shell-style');

    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
      setThemeMode(savedTheme);
    }

    if (savedStyle === 'modern' || savedStyle === 'classic') {
      setStyleMode(savedStyle);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      root.dataset.theme = themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode;
    };

    applyTheme();
    window.localStorage.setItem('app-shell-theme', themeMode);

    if (themeMode !== 'system') {
      return undefined;
    }

    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem('app-shell-style', styleMode);
  }, [styleMode]);

  const scopeName = resolveScopeName(session?.user.email, session?.user.tenantId);
  const headerMeta = resolveHeaderMeta(pathname);

  return (
    <div className="min-h-screen bg-[#020816] text-slate-100">
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,rgba(10,96,140,0.26),transparent_28%),linear-gradient(180deg,#020816_0%,#051124_55%,#020816_100%)]">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-cyan-500/12 bg-[#03101f]/82 px-6 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/75">
                  {scopeName}
                </p>
                <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-4">
                  <p className="text-2xl font-semibold uppercase tracking-[0.08em] text-white">
                    {headerMeta.label}
                  </p>
                  <p className="text-sm text-slate-400">{headerMeta.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="inline-flex rounded-full border border-cyan-500/20 bg-[#071423] p-1">
                  {(['dark', 'light', 'system'] as ThemeMode[]).map((option) => (
                    <ShellToggle
                      key={option}
                      label={option === 'dark' ? 'Escuro' : option === 'light' ? 'Claro' : 'Sistema'}
                      active={themeMode === option}
                      onClick={() => setThemeMode(option)}
                    />
                  ))}
                </div>
                <div className="inline-flex rounded-full border border-cyan-500/20 bg-[#071423] p-1">
                  {(['modern', 'classic'] as StyleMode[]).map((option) => (
                    <ShellToggle
                      key={option}
                      label={option === 'modern' ? 'Moderno' : 'Clássico'}
                      active={styleMode === option}
                      onClick={() => setStyleMode(option)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </header>

          <main
            className={[
              'flex-1 px-6 py-6 lg:px-8',
              styleMode === 'modern' ? 'pb-10' : 'pb-8'
            ].join(' ')}
          >
            <div className={styleMode === 'modern' ? 'space-y-6' : 'space-y-5'}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
