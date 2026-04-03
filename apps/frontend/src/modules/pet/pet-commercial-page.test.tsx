import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetCommercialPage } from '@/modules/pet/pet-commercial-page';

const { permissionSet, navigationState } = vi.hoisted(() => ({
  permissionSet: new Set<string>(),
  navigationState: {
    pathname: '/pet/commercial',
    searchParams: new URLSearchParams()
  }
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname,
  useSearchParams: () => navigationState.searchParams
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permissionSet.has(permission)
  })
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => <div data-testid="pet-subnav" />
}));

vi.mock('@/modules/crm/leads-page', () => ({
  CrmLeadsPage: ({ surface }: { surface?: string }) => <div>leads-surface:{surface}</div>
}));

vi.mock('@/modules/crm/deals-page', () => ({
  CrmDealsPage: ({ surface }: { surface?: string }) => <div>deals-surface:{surface}</div>
}));

vi.mock('@/modules/crm/pipeline-page', () => ({
  CrmPipelinePage: ({ surface }: { surface?: string }) => <div>pipeline-surface:{surface}</div>
}));

describe('PetCommercialPage', () => {
  beforeEach(() => {
    permissionSet.clear();
    permissionSet.add('crm.lead.read');
    permissionSet.add('crm.deal.read');
    navigationState.searchParams = new URLSearchParams();
  });

  it('defaults to the first visible PetFlow commercial tab', () => {
    render(<PetCommercialPage />);

    expect(screen.getByTestId('pet-subnav')).toBeInTheDocument();
    expect(screen.getByText('PetFlow commercial')).toBeInTheDocument();
    expect(screen.getByText('leads-surface:pet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leads' })).toHaveAttribute('href', '/pet/commercial');
    expect(screen.getByRole('link', { name: 'Negócios' })).toHaveAttribute('href', '/pet/commercial?tab=deals');
  });

  it('renders the requested commercial tab when the permission is available', () => {
    permissionSet.add('crm.pipeline.read');
    navigationState.searchParams = new URLSearchParams('tab=pipeline');

    render(<PetCommercialPage />);

    expect(screen.getByText('pipeline-surface:pet')).toBeInTheDocument();
    expect(screen.queryByText('leads-surface:pet')).not.toBeInTheDocument();
  });

  it('shows a warning when no commercial capability is available', () => {
    permissionSet.clear();

    render(<PetCommercialPage />);

    expect(screen.getByText('Você não possui permissão para visualizar o comercial do PetFlow.')).toBeInTheDocument();
  });
});
