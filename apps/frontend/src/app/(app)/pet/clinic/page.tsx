'use client';

import { ClinicDashboard } from '@/modules/pet/clinic-dashboard';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

export default function ClinicPage() {
  const t = useAppMessages().petClinic;

  return (
    <ClinicDashboard
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      showSubnav
    />
  );
}
