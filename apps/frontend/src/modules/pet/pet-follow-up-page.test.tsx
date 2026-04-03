import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetFollowUpPage } from '@/modules/pet/pet-follow-up-page';

const { permissionSet, navigationState } = vi.hoisted(() => ({
  permissionSet: new Set<string>(),
  navigationState: {
    pathname: '/pet/follow-up',
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

vi.mock('@/modules/crm/tasks-page', () => ({
  CrmTasksPage: ({ surface }: { surface?: string }) => <div>tasks-surface:{surface}</div>
}));

vi.mock('@/modules/crm/notes-page', () => ({
  CrmNotesPage: ({ surface }: { surface?: string }) => <div>notes-surface:{surface}</div>
}));

vi.mock('@/modules/crm/activity-page', () => ({
  CrmActivityPage: ({ surface }: { surface?: string }) => <div>activity-surface:{surface}</div>
}));

describe('PetFollowUpPage', () => {
  beforeEach(() => {
    permissionSet.clear();
    permissionSet.add('crm.task.read');
    permissionSet.add('crm.note.read');
    navigationState.searchParams = new URLSearchParams();
  });

  it('defaults to the first visible PetFlow follow-up tab', () => {
    render(<PetFollowUpPage />);

    expect(screen.getByTestId('pet-subnav')).toBeInTheDocument();
    expect(screen.getByText('PetFlow follow-up')).toBeInTheDocument();
    expect(screen.getByText('tasks-surface:pet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toHaveAttribute('href', '/pet/follow-up');
  });

  it('renders the requested tab when it is available for the current permissions', () => {
    navigationState.searchParams = new URLSearchParams('tab=notes');

    render(<PetFollowUpPage />);

    expect(screen.getByText('notes-surface:pet')).toBeInTheDocument();
    expect(screen.queryByText('tasks-surface:pet')).not.toBeInTheDocument();
  });

  it('shows a warning when no follow-up capability is available', () => {
    permissionSet.clear();

    render(<PetFollowUpPage />);

    expect(screen.getByText('Você não possui permissão para visualizar o follow-up do PetFlow.')).toBeInTheDocument();
  });
});
