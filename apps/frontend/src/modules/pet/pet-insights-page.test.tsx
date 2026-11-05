import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetInsightsPage } from '@/modules/pet/pet-insights-page';

const { getInsightsSummaryMock } = vi.hoisted(() => ({
  getInsightsSummaryMock: vi.fn()
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: { getInsightsSummary: getInsightsSummaryMock }
}));

vi.mock('@/shared/auth/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => children
}));

describe('PetInsightsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('summarizes the real totals and shows statuses with the shared badge', async () => {
    getInsightsSummaryMock.mockResolvedValue({
      newClientsThisMonth: 5,
      newClientsLastMonth: 3,
      topServices: [{ key: 'service-1', label: 'Banho simples', value: 12 }],
      speciesMix: [{ key: 'dog', label: 'Dog', value: 4 }],
      appointmentsByStatus: [
        { key: 'completed', label: 'Completed', value: 30 },
        { key: 'no_show', label: 'No_show', value: 10 }
      ]
    });

    render(<PetInsightsPage />);

    const metrics = (await screen.findByText('New clients this month')).closest('dl') as HTMLElement;
    expect(within(metrics).getByText('5')).toBeInTheDocument();
    expect(within(metrics).getByText('+2 vs last month')).toBeInTheDocument();
    expect(within(metrics).getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Banho simples')).toBeInTheDocument();
    expect(screen.getByText('No Show')).toBeInTheDocument();
    expect(screen.queryByText('No_show')).not.toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('reports a load failure instead of the first-cycle empty state', async () => {
    getInsightsSummaryMock.mockRejectedValue(new Error('boom'));

    render(<PetInsightsPage />);

    expect(await screen.findByText('Unable to load business insights.')).toBeInTheDocument();
    expect(screen.queryByText('Insights appear after the first operating cycle')).not.toBeInTheDocument();
  });
});
