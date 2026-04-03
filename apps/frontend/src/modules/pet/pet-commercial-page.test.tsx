import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetCommercialPage } from '@/modules/pet/pet-commercial-page';
import { petCommercialTabPermissions } from '@/shared/auth/pet-commercial-permissions';

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

vi.mock('@/modules/pet/pet-commercial-leads-page', () => ({
  PetCommercialLeadsPage: () => <div>pet-commercial-leads</div>
}));

vi.mock('@/modules/pet/pet-commercial-deals-page', () => ({
  PetCommercialDealsPage: () => <div>pet-commercial-deals</div>
}));

vi.mock('@/modules/pet/pet-commercial-pipeline-page', () => ({
  PetCommercialPipelinePage: () => <div>pet-commercial-pipeline</div>
}));

describe('PetCommercialPage', () => {
  beforeEach(() => {
    permissionSet.clear();
    permissionSet.add(petCommercialTabPermissions.leads);
    permissionSet.add(petCommercialTabPermissions.deals);
    navigationState.searchParams = new URLSearchParams();
  });

  it('defaults to the first visible PetFlow commercial tab', () => {
    render(<PetCommercialPage />);

    expect(screen.getByTestId('pet-subnav')).toBeInTheDocument();
    expect(screen.getByText('PetFlow commercial')).toBeInTheDocument();
    expect(screen.getByText('pet-commercial-leads')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leads' })).toHaveAttribute('href', '/pet/commercial');
    expect(screen.getByRole('link', { name: 'Negócios' })).toHaveAttribute('href', '/pet/commercial?tab=deals');
  });

  it('renders the requested commercial tab when the permission is available', () => {
    permissionSet.add(petCommercialTabPermissions.pipeline);
    navigationState.searchParams = new URLSearchParams('tab=pipeline');

    render(<PetCommercialPage />);

    expect(screen.getByText('pet-commercial-pipeline')).toBeInTheDocument();
    expect(screen.queryByText('pet-commercial-leads')).not.toBeInTheDocument();
  });

  it('shows a warning when no commercial capability is available', () => {
    permissionSet.clear();

    render(<PetCommercialPage />);

    expect(screen.getByText('Você não possui permissão para visualizar o comercial do PetFlow.')).toBeInTheDocument();
  });
});
