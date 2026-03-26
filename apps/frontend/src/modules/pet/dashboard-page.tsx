'use client';

import { PetOperationsDashboard } from '@/modules/pet/pet-operations-dashboard';

export function PetDashboardPage() {
  return (
    <PetOperationsDashboard
      eyebrow="PetFlow dashboard"
      title="Operations Dashboard"
      description="Acompanhe fila do dia, pets prontos, recorrencia, estoque baixo, cobranca do proximo ciclo e comissao em uma unica leitura operacional."
      showSubnav
    />
  );
}
