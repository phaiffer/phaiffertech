'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  petClinicalEntitlements,
  petRetailEntitlements,
  petSubmoduleEntitlements
} from '@/shared/entitlements/tenant-entitlements';
import { petCommercialNavigationPermissions } from '@/shared/auth/pet-commercial-permissions';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import {
  banhoTosaOnlyPlanCodes,
  filterSidebarItems,
  petClinicNavigationPlanCodes,
  petPosNavigationPlanCodes,
  petCommercialNavigationPlanCodes
} from '@/shared/platform/sidebar-navigation';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

function isActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  if (href === '/pet') {
    return pathname === '/pet';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PetModuleSubnav() {
  const pathname = usePathname();
  const t = useAppMessages().petSubnav;
  const platform = useFrontendPlatform();
  const items = filterSidebarItems([
    {
      href: '/pet/dashboard',
      label: t.dashboard,
      anyOf: ['pet.dashboard.read', 'pet.appointment.read', 'pet.invoice.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/clients',
      label: t.clients,
      anyOf: ['pet.client.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/pets',
      label: t.pets,
      anyOf: ['pet.profile.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/appointments',
      label: t.appointments,
      anyOf: ['pet.appointment.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/services',
      label: t.services,
      anyOf: ['pet.service.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/follow-up',
      label: t.followUp,
      anyOf: ['crm.task.read', 'crm.note.read', 'crm.activity.read'],
      anyEntitlements: petSubmoduleEntitlements,
      allowedPlanCodes: petCommercialNavigationPlanCodes,
      blockedPlanCodes: banhoTosaOnlyPlanCodes,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/commercial',
      label: t.commercial,
      anyOf: [...petCommercialNavigationPermissions],
      anyEntitlements: petSubmoduleEntitlements,
      allowedPlanCodes: petCommercialNavigationPlanCodes,
      blockedPlanCodes: banhoTosaOnlyPlanCodes,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/clinic',
      label: t.clinic,
      anyOf: ['pet.medical-record.read'],
      anyEntitlements: petClinicalEntitlements,
      allowedPlanCodes: petClinicNavigationPlanCodes,
      blockedPlanCodes: banhoTosaOnlyPlanCodes,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/pos',
      label: t.pos,
      anyOf: ['pet.product.read', 'pet.invoice.write'],
      anyEntitlements: petRetailEntitlements,
      allowedPlanCodes: petPosNavigationPlanCodes,
      blockedPlanCodes: banhoTosaOnlyPlanCodes,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/finance',
      label: t.finance,
      anyOf: ['finance.read', 'pet.invoice.read'],
      anyEntitlements: petSubmoduleEntitlements,
      blockedPlanCodes: banhoTosaOnlyPlanCodes,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/plans',
      label: t.plans,
      anyOf: ['pet.plan.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/inventory',
      label: t.inventory,
      anyOf: ['pet.product.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/invoices',
      label: t.invoices,
      anyOf: ['pet.invoice.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/professionals',
      label: t.professionals,
      anyOf: ['pet.professional.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    },
    {
      href: '/pet/commissions',
      label: t.commissions,
      anyOf: ['pet.appointment.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet' as const
    }
  ], {
    user: platform.user,
    modules: {
      availableCodes: platform.modules.availableCodes,
      loading: platform.modules.loading
    },
    workspace: {
      canManagePlatformAdministration: platform.workspace.canManagePlatformAdministration,
      hasFullPlatformVisibility: platform.workspace.hasFullPlatformVisibility
    }
  });

  return (
    // Comanda v2: simple tabs, underline on the active one.
    <nav className="overflow-x-auto border-b border-[color:var(--line)]">
      <div className="flex min-w-max items-center gap-4">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`-mb-px inline-flex h-9 items-center border-b-2 text-sm transition-colors ${
                active
                  ? 'border-[var(--ink)] font-semibold text-[var(--ink)]'
                  : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
