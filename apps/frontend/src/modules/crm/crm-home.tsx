'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { crmService } from '@/shared/services/crm-service';
import { CrmDashboardSummary } from '@/shared/types/crm';
import { PageTitle } from '@/shared/ui/page-title';

const quickLinks = [
  {
    href: '/crm/dashboard',
    title: 'Dashboard',
    description: 'Resumo operacional do CRM com totais, tarefas pendentes e distribuição por status.',
    permission: 'crm.dashboard.read'
  },
  {
    href: '/crm/companies',
    title: 'Companies',
    description: 'Cadastro de empresas vinculadas a contatos, leads e negócios.',
    permission: 'crm.company.read'
  },
  {
    href: '/crm/contacts',
    title: 'Contacts',
    description: 'Gestão de contatos do tenant com owner, status e vínculo com empresa.',
    permission: 'crm.contact.read'
  },
  {
    href: '/crm/leads',
    title: 'Leads',
    description: 'Entrada comercial com origem, status e vínculo com contato ou empresa.',
    permission: 'crm.lead.read'
  },
  {
    href: '/crm/deals',
    title: 'Deals',
    description: 'Negócios do pipeline com valor, previsão de fechamento e responsáveis.',
    permission: 'crm.deal.read'
  },
  {
    href: '/crm/pipeline',
    title: 'Pipeline',
    description: 'Etapas comerciais com ordem, cor, código e estágio padrão.',
    permission: 'crm.pipeline.read'
  },
  {
    href: '/crm/tasks',
    title: 'Tasks',
    description: 'Tarefas ligadas a empresa, contato, lead ou negócio.',
    permission: 'crm.task.read'
  },
  {
    href: '/crm/notes',
    title: 'Notes',
    description: 'Notas operacionais vinculadas aos registros do CRM.',
    permission: 'crm.note.read'
  },
  {
    href: '/crm/activity',
    title: 'Activity',
    description: 'Feed de eventos auditáveis relevantes para a operação comercial.',
    permission: 'crm.activity.read'
  }
];

export function CrmHome() {
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await crmService.getDashboardSummary();
        setSummary(result);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar resumo do CRM.');
      } finally {
        setLoadingSummary(false);
      }
    }

    void loadSummary();
  }, []);

  const highlights = summary ? [
    { label: 'Contacts', value: summary.totalContacts },
    { label: 'Leads', value: summary.totalLeads },
    { label: 'Companies', value: summary.totalCompanies },
    { label: 'Deals', value: summary.totalDeals },
    { label: 'Tasks abertas', value: summary.tasksPendentes }
  ] : [];

  return (
    <div className="space-y-5">
      <PageTitle title="CRM Module" description="CRM V1 com companies, contacts, leads, deals, pipeline stages, tasks, notes, activity e dashboard." />

      <PermissionGuard permission="crm.dashboard.read">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Resumo operacional</h2>
              <p className="mt-1 text-sm text-slate-600">Visão rápida do tenant atual antes de entrar no detalhe dos domínios.</p>
            </div>
            <Link href="/crm/dashboard" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
              Abrir dashboard
            </Link>
          </div>

          {loadingSummary ? <p className="mt-4 text-sm text-slate-500">Carregando resumo...</p> : null}
          {!loadingSummary && error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

          {!loadingSummary && summary ? (
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </PermissionGuard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => (
          <PermissionGuard key={item.href} permission={item.permission}>
            <Link
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action"
            >
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </Link>
          </PermissionGuard>
        ))}
      </div>
    </div>
  );
}
