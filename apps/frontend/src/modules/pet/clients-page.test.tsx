import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PetClientsPage } from '@/modules/pet/clients-page';

const { petServiceMock } = vi.hoisted(() => ({
  petServiceMock: {
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn()
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search)
}));

vi.mock('@/shared/auth/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: ReactNode }) => <>{children}</>
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

const clients = [
  {
    id: 'client-1',
    name: 'Fernanda Lima',
    email: 'fernanda@example.com',
    phone: '11999990000',
    status: 'ACTIVE',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'client-2',
    name: 'Rafael Duarte',
    phone: '11988880000',
    status: 'INACTIVE',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z'
  }
];

describe('PetClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    petServiceMock.listClients.mockResolvedValue({ items: clients, totalItems: 248, totalPages: 18, page: 0, size: 14 });
    petServiceMock.listProfiles.mockResolvedValue({ items: [], totalItems: 0, totalPages: 0, page: 0, size: 50 });
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('shows the total count in the title and the record range in the pagination', async () => {
    render(<PetClientsPage />);

    await screen.findByText('Fernanda Lima');

    expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument();
    expect(screen.getByText('248')).toBeInTheDocument();
    expect(screen.getByText('1-14 of 248')).toBeInTheDocument();
  });

  it('applies the search term passed by the sidebar (?search=)', async () => {
    window.history.replaceState(null, '', '/pet/clients?search=Fernanda');

    render(<PetClientsPage />);

    await waitFor(() => {
      expect(petServiceMock.listClients).toHaveBeenCalledWith(0, 14, 'Fernanda', { status: undefined });
    });
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('Fernanda');
  });

  it('shows the bulk action bar when rows are selected', async () => {
    render(<PetClientsPage />);
    await screen.findByText('Fernanda Lima');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Fernanda Lima' }));

    expect(screen.getByRole('region', { name: '1 selected' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
  });
});
