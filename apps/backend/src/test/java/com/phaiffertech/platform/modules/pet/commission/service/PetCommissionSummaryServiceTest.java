package com.phaiffertech.platform.modules.pet.commission.service;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLine;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentServiceLineRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.commission.dto.PetCommissionSummaryResponse;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PetCommissionSummaryServiceTest {

    private final PetAppointmentRepository appointmentRepository = mock(PetAppointmentRepository.class);
    private final PetAppointmentServiceLineRepository appointmentServiceLineRepository = mock(PetAppointmentServiceLineRepository.class);
    private final PetServiceCatalogRepository petServiceCatalogRepository = mock(PetServiceCatalogRepository.class);
    private final PetProfessionalRepository petProfessionalRepository = mock(PetProfessionalRepository.class);
    private final PetClientRepository petClientRepository = mock(PetClientRepository.class);
    private final PetProfileRepository petProfileRepository = mock(PetProfileRepository.class);

    private final PetCommissionSummaryService service = new PetCommissionSummaryService(
            appointmentRepository,
            appointmentServiceLineRepository,
            petServiceCatalogRepository,
            petProfessionalRepository,
            petClientRepository,
            petProfileRepository
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void aggregatesStructuredMultiServiceLinesAcrossProfessionalsAndStatuses() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        UUID appointmentId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        UUID petId = UUID.randomUUID();
        UUID profCarlaId = UUID.randomUUID();
        UUID profRafaelId = UUID.randomUUID();
        UUID serviceBathId = UUID.randomUUID();
        UUID serviceTrimId = UUID.randomUUID();
        UUID serviceTaxiId = UUID.randomUUID();

        PetAppointment appointment = new PetAppointment();
        ReflectionTestUtils.setField(appointment, "id", appointmentId);
        appointment.setTenantId(tenantId);
        appointment.setClientId(clientId);
        appointment.setPetId(petId);
        appointment.setServiceId(serviceBathId);
        appointment.setProfessionalId(profCarlaId);
        appointment.setStatus("COMPLETED");
        appointment.setScheduledAt(Instant.parse("2026-10-20T12:00:00Z"));

        PetAppointmentServiceLine line1 = new PetAppointmentServiceLine();
        ReflectionTestUtils.setField(line1, "id", UUID.randomUUID());
        line1.setTenantId(tenantId);
        line1.setAppointmentId(appointmentId);
        line1.setServiceId(serviceBathId);
        line1.setServiceName("Banho Completo");
        line1.setLineOrder(0);
        line1.setProfessionalId(profCarlaId);
        line1.setProfessionalName("Carla Mendes");
        line1.setServicePrice(new BigDecimal("80.00"));
        line1.setCommissionEligible(true);
        line1.setCommissionRate(new BigDecimal("0.1500"));
        line1.setCommissionAmount(new BigDecimal("12.00"));

        PetAppointmentServiceLine line2 = new PetAppointmentServiceLine();
        ReflectionTestUtils.setField(line2, "id", UUID.randomUUID());
        line2.setTenantId(tenantId);
        line2.setAppointmentId(appointmentId);
        line2.setServiceId(serviceTrimId);
        line2.setServiceName("Tosa Higienica");
        line2.setLineOrder(1);
        line2.setProfessionalId(profRafaelId);
        line2.setProfessionalName("Rafael Lima");
        line2.setServicePrice(new BigDecimal("50.00"));
        line2.setCommissionEligible(true);
        line2.setCommissionRate(new BigDecimal("0.1200"));
        line2.setCommissionAmount(new BigDecimal("6.00"));

        PetAppointmentServiceLine line3Excluded = new PetAppointmentServiceLine();
        ReflectionTestUtils.setField(line3Excluded, "id", UUID.randomUUID());
        line3Excluded.setTenantId(tenantId);
        line3Excluded.setAppointmentId(appointmentId);
        line3Excluded.setServiceId(serviceTaxiId);
        line3Excluded.setServiceName("Taxa de Transporte");
        line3Excluded.setLineOrder(2);
        line3Excluded.setProfessionalId(profCarlaId);
        line3Excluded.setProfessionalName("Carla Mendes");
        line3Excluded.setServicePrice(new BigDecimal("20.00"));
        line3Excluded.setCommissionEligible(false);
        line3Excluded.setCommissionAmount(BigDecimal.ZERO);

        PetClient client = new PetClient();
        ReflectionTestUtils.setField(client, "id", clientId);
        client.setName("Maria Oliveira");

        PetProfile pet = new PetProfile();
        ReflectionTestUtils.setField(pet, "id", petId);
        pet.setName("Rex");

        PetProfessional carla = new PetProfessional();
        ReflectionTestUtils.setField(carla, "id", profCarlaId);
        carla.setName("Carla Mendes");

        PetProfessional rafael = new PetProfessional();
        ReflectionTestUtils.setField(rafael, "id", profRafaelId);
        rafael.setName("Rafael Lima");

        when(appointmentRepository.findAllByTenantIdAndDeletedAtIsNullAndStatusOrderByScheduledAtDescIdDesc(tenantId, "COMPLETED"))
                .thenReturn(List.of(appointment));
        when(appointmentServiceLineRepository.findAllByTenantIdAndAppointmentIdInOrderByAppointmentIdAscLineOrderAsc(
                eq(tenantId), eq(List.of(appointmentId))))
                .thenReturn(List.of(line1, line2, line3Excluded));
        when(petServiceCatalogRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of());
        when(petProfessionalRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of(carla, rafael));
        when(petClientRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of(client));
        when(petProfileRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of(pet));

        PetCommissionSummaryResponse response = service.summary(null, null);

        assertEquals(new BigDecimal("18.00"), response.totalCommissionAmount());
        assertEquals(2, response.professionalCount());
        assertEquals(2, response.generatedLineCount());
        assertEquals(1, response.excludedLineCount());
        assertEquals(0, response.eligibleWithoutAmountLineCount());
        assertEquals(1, response.contributingAppointmentCount());

        assertEquals("Carla Mendes", response.professionals().get(0).professionalName());
        assertEquals(new BigDecimal("12.00"), response.professionals().get(0).totalCommissionAmount());
        assertEquals(1, response.professionals().get(0).generatedLineCount());
        assertEquals(1, response.professionals().get(0).excludedLineCount());

        assertEquals("Rafael Lima", response.professionals().get(1).professionalName());
        assertEquals(new BigDecimal("6.00"), response.professionals().get(1).totalCommissionAmount());
        assertEquals("STRUCTURED_LINE", response.details().get(0).dataSource());
    }

    @Test
    void fallsBackToLegacyAppointmentFieldsWhenStructuredLinesDoNotExist() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        UUID appointmentId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        UUID petId = UUID.randomUUID();
        UUID profId = UUID.randomUUID();
        UUID serviceId = UUID.randomUUID();

        PetAppointment appointment = new PetAppointment();
        ReflectionTestUtils.setField(appointment, "id", appointmentId);
        appointment.setTenantId(tenantId);
        appointment.setClientId(clientId);
        appointment.setPetId(petId);
        appointment.setServiceId(serviceId);
        appointment.setServiceName("Banho e Tosa");
        appointment.setProfessionalId(profId);
        appointment.setStatus("COMPLETED");
        appointment.setServicePrice(new BigDecimal("90.00"));
        appointment.setCommissionAmount(new BigDecimal("13.50"));
        appointment.setScheduledAt(Instant.parse("2026-10-20T14:00:00Z"));

        PetServiceCatalog catalog = new PetServiceCatalog();
        ReflectionTestUtils.setField(catalog, "id", serviceId);
        catalog.setCommissionEligible(true);

        when(appointmentRepository.findAllByTenantIdAndDeletedAtIsNullAndStatusOrderByScheduledAtDescIdDesc(tenantId, "COMPLETED"))
                .thenReturn(List.of(appointment));
        when(appointmentServiceLineRepository.findAllByTenantIdAndAppointmentIdInOrderByAppointmentIdAscLineOrderAsc(
                eq(tenantId), eq(List.of(appointmentId))))
                .thenReturn(List.of());
        when(petServiceCatalogRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of(catalog));
        when(petProfessionalRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of());
        when(petClientRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of());
        when(petProfileRepository.findAllByTenantIdAndIdIn(eq(tenantId), any())).thenReturn(List.of());

        PetCommissionSummaryResponse response = service.summary(null, null);

        assertEquals(new BigDecimal("13.50"), response.totalCommissionAmount());
        assertEquals(1, response.generatedLineCount());
        assertEquals("COMPATIBILITY_FALLBACK", response.details().get(0).dataSource());
        assertEquals("GENERATED", response.details().get(0).lineStatus());
    }
}
