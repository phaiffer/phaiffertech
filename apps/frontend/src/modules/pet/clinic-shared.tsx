'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

export function petProfileHref(petId: string) {
  return `/pet/pets/${petId}/timeline`;
}

export function ClinicTabs() {
  const tabs = useAppMessages().petClinic.tabs;
  const pathname = usePathname();
  const items = [
    { href: '/pet/clinic', label: tabs.overview },
    { href: '/pet/medical-records', label: tabs.records },
    { href: '/pet/clinic/timeline', label: tabs.timeline }
  ];

  return (
    <nav aria-label={tabs.label} className="flex gap-4 overflow-x-auto overflow-y-hidden border-b border-[color:var(--line)]">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 py-2 text-sm ${
              active
                ? 'border-[color:var(--ink)] font-medium text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const eventTones: Record<string, string> = {
  MEDICAL_RECORD: 'in-progress',
  VACCINATION: 'done',
  PRESCRIPTION: 'waiting'
};

export function ClinicEventType({ type }: { type: string }) {
  const labels = useAppMessages().petClinic.timeline.types;
  const eventLabels: Record<string, string> = {
    MEDICAL_RECORD: labels.medicalRecord,
    VACCINATION: labels.vaccination,
    PRESCRIPTION: labels.prescription
  };

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[var(--ink-2)]">
      <span className="ui-status-dot" data-status={eventTones[type] ?? 'waiting'} aria-hidden="true" />
      {eventLabels[type] ?? type}
    </span>
  );
}
