import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClinicTimelinePage } from '@/modules/pet/clinic-timeline-page';

const { petServiceMock } = vi.hoisted(() => ({
  petServiceMock: {
    getClinicalTimeline: vi.fn(),
    listProfiles: vi.fn(),
    listProfessionals: vi.fn()
  }
}));

vi.mock('@/shared/services/pet-service', () => ({ petService: petServiceMock }));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => ({
    user: { permissions: [] },
    workspace: { hasFullPlatformVisibility: true, canManagePlatformAdministration: false }
  })
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/pet/clinic/timeline' }));

function page<T>(items: T[]) {
  return { items, totalItems: items.length, totalPages: 1, page: 0, size: 200 };
}

describe('ClinicTimelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    petServiceMock.listProfiles.mockResolvedValue(page([{ id: 'pet-1', name: 'Rex' }]));
    petServiceMock.listProfessionals.mockResolvedValue(page([]));
    petServiceMock.getClinicalTimeline.mockResolvedValue({
      totalEvents: 1,
      events: [{
        eventType: 'VACCINATION',
        eventId: 'event-1',
        occurredAt: '2026-03-10T10:00:00Z',
        petId: 'pet-1',
        petName: 'Rex',
        title: 'Raiva',
        summary: 'Dose anual'
      }]
    });
  });

  it('asks for a pet instead of calling the API, which requires one', async () => {
    render(<ClinicTimelinePage />);

    expect(await screen.findByText('Select a pet to see its clinical history.')).toBeInTheDocument();
    expect(screen.queryByText('Unable to load the clinical timeline.')).not.toBeInTheDocument();
    expect(petServiceMock.getClinicalTimeline).not.toHaveBeenCalled();
  });

  it('loads the history of the selected pet', async () => {
    render(<ClinicTimelinePage />);

    await screen.findByRole('option', { name: 'Rex' });
    fireEvent.change(screen.getByLabelText('Pet'), { target: { value: 'pet-1' } });

    await waitFor(() => {
      expect(petServiceMock.getClinicalTimeline).toHaveBeenCalledWith({ petId: 'pet-1', limit: 50 });
    });
    expect(await screen.findByText('Raiva')).toBeInTheDocument();
  });
});
