'use client';

import { useEffect, useState } from 'react';
import { ApiClientError } from '@/shared/lib/http';
import { findModule, useModuleCatalog } from '@/shared/modules/use-module-catalog';
import { moduleService } from '@/shared/services/module-service';
import { PlatformDashboardSummary } from '@/shared/types/module';
import { Card } from '@/shared/ui/card';
import { PageTitle } from '@/shared/ui/page-title';
import Link from 'next/link';

export default function DashboardPage() {
  const { modules, error } = useModuleCatalog();
  const [summary, setSummary] = useState<PlatformDashboardSummary>({ modules: [] });
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
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setSummaryError(err instanceof ApiClientError ? err.message : 'Erro ao carregar resumo da plataforma.');
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
        description="Visão da plataforma baseada em module registry, capabilities e acesso consolidado por tenant."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Módulos Disponíveis" subtitle="Tenant + feature flag">
          <p className="text-3xl font-semibold text-action">{availableModules.length}</p>
        </Card>
        <Card title="Bindings do Tenant" subtitle="Module enablement">
          <p className="text-3xl font-semibold text-ink">{tenantEnabledModules.length}</p>
        </Card>
        <Card title="Feature Flags" subtitle="Rollout fino">
          <p className="text-3xl font-semibold text-accent">{featureFlagEnabledModules.length}</p>
        </Card>
      </div>

      <Card title="Registry de módulos" subtitle="Diferença entre binding do tenant e feature flag">
        {error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {modules.map((moduleItem) => (
              <li key={moduleItem.code} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">{moduleItem.name}</span>
                <span className="ml-2 text-slate-500">({moduleItem.code})</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${moduleItem.available ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {moduleItem.available ? 'disponível' : 'indisponível'}
                </span>
                <span className="ml-2 text-slate-500">
                  tenant={moduleItem.moduleEnabled ? 'on' : 'off'} | flag={moduleItem.featureFlagEnabled ? 'on' : 'off'}
                </span>
              </li>
            ))}
            {modules.length === 0 ? <li className="text-slate-500">Nenhum módulo retornado pela API.</li> : null}
          </ul>
        )}
      </Card>

      <Card title="Summaries por capability" subtitle="Agregação central sem acesso direto a repositories verticais">
        {summaryError ? <p className="text-sm text-rose-700">{summaryError}</p> : null}
        {!summaryError ? (
          <div className="grid gap-4 md:grid-cols-3">
            {summary.modules.map((moduleSummary) => {
              const moduleItem = findModule(modules, moduleSummary.moduleCode);
              return (
                <section key={moduleSummary.moduleCode} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-ink">{moduleSummary.title}</h3>
                    <p className="text-xs text-slate-500">{moduleSummary.description}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {moduleItem?.available ? 'módulo disponível' : 'módulo indisponível'}
                    </p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {moduleSummary.metrics.map((metric) => (
                      <li key={metric.key} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                        <span className="text-slate-600">{metric.label}</span>
                        <span className="font-semibold text-slate-900">{metric.value}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={moduleSummary.href} className="mt-3 inline-block text-sm font-medium text-action">
                    Abrir módulo
                  </Link>
                </section>
              );
            })}
            {summary.modules.length === 0 ? <p className="text-sm text-slate-500">Nenhuma capability de módulo retornou resumo para o tenant atual.</p> : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
