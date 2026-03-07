'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { crmService } from '@/shared/services/crm-service';
import { CrmDashboardSummary } from '@/shared/types/crm';
import { PageTitle } from '@/shared/ui/page-title';

function entries(record: Record<string, number>) {
  return Object.entries(record).sort((left, right) => right[1] - left[1]);
}

export function CrmDashboardPage() {
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.getDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar dashboard do CRM.');
    } finally {
      setLoading(false);
    }
  }

  const stats = summary ? [
    { label: 'Contacts', value: summary.totalContacts, href: '/crm/contacts' },
    { label: 'Leads', value: summary.totalLeads, href: '/crm/leads' },
    { label: 'Companies', value: summary.totalCompanies, href: '/crm/companies' },
    { label: 'Deals', value: summary.totalDeals, href: '/crm/deals' },
    { label: 'Tasks pendentes', value: summary.tasksPendentes, href: '/crm/tasks' }
  ] : [];

  return (
    <PermissionGuard
      permission="crm.dashboard.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o dashboard do CRM.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Dashboard" description="Resumo operacional do tenant com contadores e distribuição de status." />

        {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando dashboard...</div> : null}
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {stats.map((item) => (
                <Link key={item.label} href={item.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{item.value}</p>
                </Link>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Deals por status</h2>
                <div className="mt-4 space-y-3">
                  {entries(summary.dealsPorStatus).length === 0 ? <p className="text-sm text-slate-500">Nenhum negócio contabilizado.</p> : null}
                  {entries(summary.dealsPorStatus).map(([status, value]) => (
                    <div key={status} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <span className="text-sm text-slate-700">{status}</span>
                      <span className="text-sm font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Leads por status</h2>
                <div className="mt-4 space-y-3">
                  {entries(summary.leadsPorStatus).length === 0 ? <p className="text-sm text-slate-500">Nenhum lead contabilizado.</p> : null}
                  {entries(summary.leadsPorStatus).map(([status, value]) => (
                    <div key={status} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <span className="text-sm text-slate-700">{status}</span>
                      <span className="text-sm font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
