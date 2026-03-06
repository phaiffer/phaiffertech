'use client';

import { useEffect, useState } from 'react';
import { moduleService } from '@/shared/services/module-service';
import { ModuleItem } from '@/shared/types/module';
import { Card } from '@/shared/ui/card';
import { PageTitle } from '@/shared/ui/page-title';

export default function DashboardPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    moduleService
      .list()
      .then(setModules)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Dashboard"
        description="Visão inicial da plataforma e módulos habilitados para o tenant atual."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Módulos Ativos" subtitle="Registry por tenant">
          <p className="text-3xl font-semibold text-action">{modules.length}</p>
        </Card>
        <Card title="Stack" subtitle="Foundation">
          <p className="text-sm text-slate-600">Spring Boot + Next.js + MySQL + Flyway</p>
        </Card>
        <Card title="Status" subtitle="Health">
          <p className="text-sm font-semibold text-accent">Operacional</p>
        </Card>
      </div>

      <Card title="Módulos habilitados" subtitle="Feature toggles por tenant">
        {error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {modules.map((moduleItem) => (
              <li key={moduleItem.code} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">{moduleItem.name}</span>
                <span className="ml-2 text-slate-500">({moduleItem.code})</span>
              </li>
            ))}
            {modules.length === 0 ? <li className="text-slate-500">Nenhum módulo retornado pela API.</li> : null}
          </ul>
        )}
      </Card>
    </div>
  );
}
