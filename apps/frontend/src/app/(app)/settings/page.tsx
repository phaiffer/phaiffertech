import { Card } from '@/shared/ui/card';
import { PageTitle } from '@/shared/ui/page-title';

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageTitle title="Settings" description="Base inicial para configurações por tenant e por módulo." />
      <Card title="Configurações da plataforma" subtitle="Skeleton para evolução">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Tenant settings</li>
          <li>Feature toggles</li>
          <li>Notificações</li>
          <li>Assinaturas e billing</li>
        </ul>
      </Card>
    </div>
  );
}
