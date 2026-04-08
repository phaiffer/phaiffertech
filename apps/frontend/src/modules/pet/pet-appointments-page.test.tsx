import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetAppointmentsPage } from '@/modules/pet/pet-appointments-page';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

const { currentPlatformState, hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  currentPlatformState: {
    user: {
      userId: 'user-1',
      email: 'pet@tenant.test',
      fullName: 'Pet Operator',
      tenantId: 'tenant-1',
      tenantName: 'Clinic North',
      tenantCode: 'clinic-north',
      tenantPlanCode: 'BANHO_TOSA_CLINICA',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'LIGHT',
      tenantAllowUserThemeOverride: true,
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_ADMIN',
      permissions: [],
      featureEntitlements: ['pet.aesthetics', 'pet.clinic', 'pet.retail', 'pet.veterinary']
    },
    theme: {
      mode: 'light',
      setMode: vi.fn(),
      tenantDefaultMode: 'light',
      canOverride: true
    },
    branding: {
      logoUrl: null,
      scopeName: 'Clinic North',
      tenantCode: 'clinic-north',
      style: {}
    },
    visualProfile: {
      key: 'pet-clinic',
      label: 'Pet Clinic',
      accentFallback: '#0f766e',
      primaryFallback: '#164e63',
      accentColor: '#2563eb',
      primaryColor: '#0f172a',
      accentTone: { emphasis: 'clinical', softAlpha: 0.18, highlightAlpha: 0.14 },
      backgroundMood: { softness: 'soft', accentOpacity: 0.11, supportOpacity: 0.09, accentAnchor: 'top left', supportAnchor: 'bottom center' },
      surfaceNuance: { tintOpacity: 0.15, borderOpacity: 0.17, elevation: 'quiet' },
      iconTone: { emphasisOpacity: 0.16, mutedOpacity: 0.08 },
      chartHighlightTone: { accentOpacity: 0.22, supportOpacity: 0.12 },
      dashboardHighlightTone: { accentOpacity: 0.12, supportOpacity: 0.09 },
      loginVisualContext: { accentOpacity: 0.11, supportOpacity: 0.1, cardTintOpacity: 0.05, cardBorderOpacity: 0.16, brandMarkOpacity: 0.15 },
      illustrationPreset: 'clinical-care'
    },
    workspace: {
      workspaceLabel: 'Tenant workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    },
    modules: {
      items: [],
      loading: false,
      error: null,
      availableCodes: ['PET'],
      contractedProducts: []
    }
  } as FrontendPlatformState,
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    listServices: vi.fn(),
    listProfessionals: vi.fn(),
    listClientPlans: vi.fn(),
    listAppointments: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => currentPlatformState
}));

function createPageResponse<T>(items: T[]) {
  return {
    items,
    totalItems: items.length,
    totalPages: 1,
    page: 0,
    size: 10
  };
}

function setGrantedPermissions(granted: string[]) {
  hasPermissionMock.mockImplementation((permission: string) => granted.includes(permission));
  hasAnyPermissionMock.mockImplementation((permissions: string[]) => permissions.some((permission) => granted.includes(permission)));
}

describe('PetAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setGrantedPermissions(['pet.appointment.read', 'pet.appointment.create', 'pet.medical-record.read']);

    petServiceMock.listClients.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([]));
    petServiceMock.listClientPlans.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([
      {
        id: 'appointment-1',
        clientId: 'client-1',
        clientName: 'Owner Example',
        petId: 'pet-1',
        petName: 'Pet Example',
        serviceId: 'service-1',
        serviceName: 'Bath',
        professionalId: 'professional-1',
        professionalName: 'Dr Example',
        scheduledAt: '2026-03-10T10:00:00Z',
        status: 'COMPLETED',
        clientPlanId: 'plan-1',
        planRemainingSessions: 2,
        planSessionConsumed: true,
        commissionAmount: 18.5,
        medicalRecordCount: 0,
        vaccinationCount: 0,
        prescriptionCount: 0,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
  });

  it('shows degraded lookup diagnostics and enriched labels in the appointment table', async () => {
    render(<PetAppointmentsPage />);

    await waitFor(() => {
      expect(petServiceMock.listAppointments).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Operating focus')).toBeInTheDocument();
    expect(screen.getByText('Recurring')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Plan alerts')).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes('18.50') || text.includes('18,50'))).toBeInTheDocument();

    const switchToListButton = screen.queryByRole('button', { name: 'Switch to list' });
    if (switchToListButton) {
      fireEvent.click(switchToListButton);
    }

    expect(screen.getByText('Some PetFlow references are not yet available.')).toBeInTheDocument();
    expect(screen.getByText(/pet\.client\.read/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Owner Example')).toBeInTheDocument();
      expect(screen.getByText('Pet Example')).toBeInTheDocument();
      expect(screen.getByText('Dr Example')).toBeInTheDocument();
      expect(screen.getByText('Bath')).toBeInTheDocument();
      expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Recurring').length).toBeGreaterThan(0);
      expect(screen.getByText('Pickup message skipped: client without email')).toBeInTheDocument();
      expect(screen.getByText('Renewal alert triggered')).toBeInTheDocument();
      expect(screen.getByText('0 records · 0 vaccines · 0 rx')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Care notes' })).toHaveAttribute(
        'href',
        '/pet/medical-records?appointmentId=appointment-1'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book appointment' }));

    expect(
      screen.getByText((text) => text.includes('Before booking, add at least one client, pet, service, and professional'))
    ).toBeInTheDocument();
  });

  it('shows structured service context and warns when the selected service requires a plan', async () => {
    setGrantedPermissions([
      'pet.appointment.read',
      'pet.appointment.create',
      'pet.client.read',
      'pet.profile.read',
      'pet.service.read',
      'pet.professional.read'
    ]);

    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Owner Example',
        status: 'ACTIVE',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Pet Example',
        species: 'Dog',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-plan-only',
        name: 'Hydration session',
        category: 'GROOMING',
        active: true,
        basePrice: 120,
        durationMinutes: 90,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: false,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([
      {
        id: 'professional-1',
        name: 'Dr Example',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));

    render(<PetAppointmentsPage />);

    await waitFor(() => {
      expect(petServiceMock.listServices).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book appointment' }));

    expect(screen.getByText('Add one or more services to confirm the bundle, total duration, base price, and booking rule.')).toBeInTheDocument();

    const serviceSelect = screen.getAllByLabelText('Service')[1];
    fireEvent.change(serviceSelect, { target: { value: 'service-plan-only' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));

    expect(await screen.findByText('Structured services')).toBeInTheDocument();
    expect(screen.getAllByText(/Hydration session · Grooming · 90 min/).length).toBeGreaterThan(0);
    expect(screen.getByText('Unavailable for new scheduling')).toBeInTheDocument();
    expect(screen.getByText('At least one selected service requires a linked plan before booking.')).toBeInTheDocument();
  });

  it('shows commission-ready and excluded service lines in the multi-service summary', async () => {
    setGrantedPermissions([
      'pet.appointment.read',
      'pet.appointment.create',
      'pet.client.read',
      'pet.profile.read',
      'pet.service.read',
      'pet.professional.read'
    ]);

    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Owner Example',
        status: 'ACTIVE',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Pet Example',
        species: 'Dog',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-grooming',
        name: 'Grooming',
        category: 'GROOMING',
        active: true,
        basePrice: 80,
        durationMinutes: 60,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      },
      {
        id: 'service-vaccine',
        name: 'Vaccination',
        category: 'CLINICAL',
        active: true,
        basePrice: 50,
        durationMinutes: 20,
        commissionEligible: false,
        allowInPlans: true,
        allowStandaloneBooking: true,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([
      {
        id: 'professional-1',
        name: 'Dr Example',
        commissionRate: 0.15,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));

    render(<PetAppointmentsPage />);

    await waitFor(() => {
      expect(petServiceMock.listProfessionals).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
    fireEvent.change(screen.getAllByLabelText('Client')[1], { target: { value: 'client-1' } });
    fireEvent.change(screen.getAllByLabelText('Pet')[1], { target: { value: 'pet-1' } });

    const serviceSelect = screen.getAllByLabelText('Service')[1];
    fireEvent.change(serviceSelect, { target: { value: 'service-grooming' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));
    fireEvent.change(serviceSelect, { target: { value: 'service-vaccine' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));
    fireEvent.change(screen.getAllByLabelText('Professional')[1], { target: { value: 'professional-1' } });

    expect(screen.getByText((text) => text.includes('Commission ready') && text.includes('15%') && text.includes('12.00'))).toBeInTheDocument();
    expect(screen.getByText('Commission excluded by service rule')).toBeInTheDocument();
    expect(screen.getByText('Commission lines')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('submits a multi-service appointment with the first service kept as the compatibility anchor', async () => {
    setGrantedPermissions([
      'pet.appointment.read',
      'pet.appointment.create',
      'pet.client.read',
      'pet.profile.read',
      'pet.service.read',
      'pet.professional.read'
    ]);

    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Owner Example',
        status: 'ACTIVE',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Pet Example',
        species: 'Dog',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-bath',
        name: 'Bath',
        category: 'GROOMING',
        active: true,
        basePrice: 80,
        durationMinutes: 60,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      },
      {
        id: 'service-hydration',
        name: 'Hydration',
        category: 'GROOMING',
        active: true,
        basePrice: 45,
        durationMinutes: 30,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([
      {
        id: 'professional-1',
        name: 'Dr Example',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
    petServiceMock.createAppointment.mockResolvedValue({
      id: 'appointment-new'
    });

    render(<PetAppointmentsPage />);

    await waitFor(() => {
      expect(petServiceMock.listServices).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book appointment' }));

    fireEvent.change(screen.getAllByLabelText('Client')[1], { target: { value: 'client-1' } });
    fireEvent.change(screen.getAllByLabelText('Pet')[1], { target: { value: 'pet-1' } });

    const serviceSelect = screen.getAllByLabelText('Service')[1];
    fireEvent.change(serviceSelect, { target: { value: 'service-bath' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));
    fireEvent.change(serviceSelect, { target: { value: 'service-hydration' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));

    fireEvent.change(screen.getAllByLabelText('Professional')[1], { target: { value: 'professional-1' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2026-03-10T10:30' } });

    expect(screen.getByText('2 services selected')).toBeInTheDocument();
    expect(screen.getByText('90 min')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Book appointment' })[1]);

    await waitFor(() => {
      expect(petServiceMock.createAppointment).toHaveBeenCalledWith(expect.objectContaining({
        serviceId: 'service-bath',
        serviceIds: ['service-bath', 'service-hydration'],
        serviceLineAssignments: [
          { serviceId: 'service-bath', professionalId: 'professional-1' },
          { serviceId: 'service-hydration', professionalId: 'professional-1' }
        ]
      }));
    });
  });

  it('allows a different professional per selected service line', async () => {
    setGrantedPermissions([
      'pet.appointment.read',
      'pet.appointment.create',
      'pet.client.read',
      'pet.profile.read',
      'pet.service.read',
      'pet.professional.read'
    ]);

    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Owner Example',
        status: 'ACTIVE',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Pet Example',
        species: 'Dog',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-bath',
        name: 'Bath',
        category: 'GROOMING',
        active: true,
        basePrice: 80,
        durationMinutes: 60,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      },
      {
        id: 'service-vaccine',
        name: 'Vaccination',
        category: 'CLINICAL',
        active: true,
        basePrice: 50,
        durationMinutes: 20,
        commissionEligible: false,
        allowInPlans: true,
        allowStandaloneBooking: true,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([
      {
        id: 'professional-1',
        name: 'Groomer One',
        commissionRate: 0.15,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      },
      {
        id: 'professional-2',
        name: 'Vet Two',
        commissionRate: 0.1,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
    petServiceMock.createAppointment.mockResolvedValue({
      id: 'appointment-new'
    });

    render(<PetAppointmentsPage />);

    await waitFor(() => {
      expect(petServiceMock.listProfessionals).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
    fireEvent.change(screen.getAllByLabelText('Client')[1], { target: { value: 'client-1' } });
    fireEvent.change(screen.getAllByLabelText('Pet')[1], { target: { value: 'pet-1' } });

    const serviceSelect = screen.getAllByLabelText('Service')[1];
    fireEvent.change(serviceSelect, { target: { value: 'service-bath' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));
    fireEvent.change(serviceSelect, { target: { value: 'service-vaccine' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));

    fireEvent.change(screen.getAllByLabelText('Professional')[1], { target: { value: 'professional-1' } });

    const lineProfessionalSelects = screen.getAllByLabelText('Responsible professional');
    fireEvent.change(lineProfessionalSelects[1], { target: { value: 'professional-2' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2026-03-10T10:30' } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Book appointment' })[1]);

    await waitFor(() => {
      expect(petServiceMock.createAppointment).toHaveBeenCalledWith(expect.objectContaining({
        professionalId: 'professional-1',
        serviceLineAssignments: [
          { serviceId: 'service-bath', professionalId: 'professional-1' },
          { serviceId: 'service-vaccine', professionalId: 'professional-2' }
        ]
      }));
    });
  });
});
