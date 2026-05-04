package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementService;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentServiceLineInventoryPlanRepository;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentServiceLineRepository;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.medical.prescription.repository.PetPrescriptionRepository;
import com.phaiffertech.platform.modules.pet.medical.record.repository.PetMedicalRecordRepository;
import com.phaiffertech.platform.modules.pet.medical.vaccination.repository.PetVaccinationRepository;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.modules.pet.plan.repository.PlanTemplateServiceRepository;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceInventoryLinkRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.service.PetServiceCatalogCategoryPolicyService;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetAppointmentServiceTest {

    private final ClientPlanRepository clientPlanRepository = mock(ClientPlanRepository.class);
    private final PetOperationalTriggerService operationalTriggerService = mock(PetOperationalTriggerService.class);
    private final PetAppointmentService service = new PetAppointmentService(
            mock(PetAppointmentRepository.class),
            mock(PetAppointmentServiceLineRepository.class),
            mock(PetAppointmentServiceLineInventoryPlanRepository.class),
            mock(PetClientRepository.class),
            mock(PetProfileRepository.class),
            mock(PetServiceCatalogRepository.class),
            mock(PetServiceInventoryLinkRepository.class),
            mock(InventoryItemRepository.class),
            mock(InventoryMovementService.class),
            mock(PetProfessionalRepository.class),
            mock(PetMedicalRecordRepository.class),
            mock(PetVaccinationRepository.class),
            mock(PetPrescriptionRepository.class),
            mock(PlatformMetricsService.class),
            clientPlanRepository,
            mock(PlanTemplateServiceRepository.class),
            operationalTriggerService,
            mock(PetServiceCatalogCategoryPolicyService.class),
            mock(CurrentUserService.class)
    );

    @Test
    void consumesPlanSessionOnceWhenCompletedAndSkipsDuplicateConsumption() {
        UUID tenantId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        ClientPlan plan = new ClientPlan();
        plan.setTenantId(tenantId);
        plan.setTotalSessions(4);
        plan.setUsedSessions(2);

        PetAppointment appointment = new PetAppointment();
        appointment.setTenantId(tenantId);
        appointment.setClientPlanId(planId);
        appointment.setStatus("COMPLETED");

        when(clientPlanRepository.findByIdAndTenantId(planId, tenantId)).thenReturn(Optional.of(plan));

        ReflectionTestUtils.invokeMethod(service, "tryConsumePlanSession", tenantId, appointment);
        ReflectionTestUtils.invokeMethod(service, "tryConsumePlanSession", tenantId, appointment);

        assertEquals(3, plan.getUsedSessions());
        assertEquals(1, plan.getRemainingSessions());
        assertTrue(appointment.isPlanSessionConsumed());
        verify(clientPlanRepository).save(plan);
        verify(operationalTriggerService).preparePlanLastUseReminder(plan, tenantId);
    }

    @Test
    void doesNotConsumePlanSessionBeforeCompletion() {
        UUID tenantId = UUID.randomUUID();
        PetAppointment appointment = new PetAppointment();
        appointment.setTenantId(tenantId);
        appointment.setClientPlanId(UUID.randomUUID());
        appointment.setStatus("CONFIRMED");

        ReflectionTestUtils.invokeMethod(service, "tryConsumePlanSession", tenantId, appointment);

        verify(clientPlanRepository, never()).save(org.mockito.ArgumentMatchers.any());
        assertEquals(false, appointment.isPlanSessionConsumed());
    }
}
