'use client';

import { PetOperationsDashboard } from '@/modules/pet/pet-operations-dashboard';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

export function PetDashboardPage() {
  const messages = useAppMessages().dashboardRoutes;

  return (
    <PetOperationsDashboard
      eyebrow={messages.petDashboardEyebrow}
      title={messages.petDashboardTitle}
      description={messages.petDashboardDescription}
      showSubnav
    />
  );
}
