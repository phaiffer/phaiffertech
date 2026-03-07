'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { findModule, useModuleCatalog } from '@/shared/modules/use-module-catalog';
import { moduleService } from '@/shared/services/module-service';
import { PlatformDashboardSummary } from '@/shared/types/module';
import { PageTitle } from '@/shared/ui/page-title';

export default function DashboardPage() {
  const { modules, error } = useModuleCatalog();
  const [summary, setSummary] = useState<PlatformDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    moduleService
      .getDashboardSummary()
      .then((result) => {
        if (!active) {
          return;
        }
        setSummary(result);
        setSummaryError(null);
        setSummaryLoading(false);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setSummaryError(err instanceof ApiClientError ? err.message : 'Erro ao carregar resumo da plataforma.');
        setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const availableModules = modules.filter((moduleItem) => moduleItem.available);
  const tenantEnabledModules = modules.filter((moduleItem) => moduleItem.moduleEnabled);
  const featureFlagEnabledModules = modules.filter((moduleItem) => moduleItem.featureFlagEnabled);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Dashboard"
        description="Visão executiva da plataforma, agregada por capabilities de módulo e governada por access control do tenant."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available Modules</p>
          <p className="mt-3 text-3xl font-semibold text-action">{availableModules.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant Bindings</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{tenantEnabledModules.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Feature Flags</p>
          <p className="mt-3 text-3xl font-semibold text-accent">{featureFlagEnabledModules.length}</p>
        </div>
      </div>

      {summaryError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{summaryError}</div> : null}

      {summary?.coreSummary ? <DashboardSection section={summary.coreSummary} /> : null}

      <section className="rounded-3xl border border-slate-200 bg-panel p-5 shadow-card">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-ink">Module Access Matrix</h2>
          <p className="mt-1 text-sm text-slate-500">Separação explícita entre binding do tenant, feature flag e disponibilidade final.</p>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : modules.length === 0 ? (
          <EmptyStateCard title="Sem módulos" description="Nenhum módulo foi retornado pelo catálogo da plataforma." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {modules.map((moduleItem) => (
              <div key={moduleItem.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{moduleItem.code}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{moduleItem.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{moduleItem.description}</p>
                  </div>
                  <StatusBadge status={moduleItem.available ? 'ok' : 'warn'} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Tenant</span>
                    <StatusBadge status={moduleItem.moduleEnabled ? 'active' : 'offline'} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Flag</span>
                    <StatusBadge status={moduleItem.featureFlagEnabled ? 'ok' : 'warn'} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Module Executive Summaries</h2>
          <p className="mt-1 text-sm text-slate-500">Cada seção abaixo vem exclusivamente das capabilities expostas por CRM, IoT e Pet.</p>
        </div>

        {summaryLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando summaries dos módulos...</div>
        ) : summary && summary.modules.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {summary.modules.map((moduleSummary) => {
              const moduleItem = findModule(modules, moduleSummary.moduleCode);
              return (
                <section key={moduleSummary.moduleCode} className="rounded-3xl border border-slate-200 bg-panel p-5 shadow-card">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{moduleSummary.moduleCode}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{moduleSummary.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{moduleSummary.description}</p>
                    </div>
                    <StatusBadge status={moduleItem?.available ? 'ok' : 'warn'} />
                  </div>

                  <MetricGrid cards={moduleSummary.summaryCards} columns="md:grid-cols-2" />

                  <Link href={moduleSummary.href} className="mt-4 inline-flex text-sm font-medium text-action">
                    Abrir dashboard do módulo
                  </Link>
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyStateCard
            title="Nenhum resumo disponível"
            description="Nenhum módulo habilitado e autorizado retornou summary para o usuário atual."
          />
        )}
      </section>
    </div>
  );
}
