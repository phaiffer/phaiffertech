package com.phaiffertech.platform.modules.pet.billing.service;

import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.billing.domain.PetBillingMessageSettings;
import com.phaiffertech.platform.modules.pet.billing.dto.PetPreparedCustomerMessageResponse;
import com.phaiffertech.platform.modules.pet.billing.repository.PetBillingMessageSettingsRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceResponse;
import com.phaiffertech.platform.modules.pet.invoice.service.PetInvoiceService;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PetBillingMessageSettingsServiceTest {

    private final PetBillingMessageSettingsRepository settingsRepository = mock(PetBillingMessageSettingsRepository.class);
    private final ClientPlanRepository clientPlanRepository = mock(ClientPlanRepository.class);
    private final PetClientRepository petClientRepository = mock(PetClientRepository.class);
    private final PetProfileRepository petProfileRepository = mock(PetProfileRepository.class);
    private final PetInvoiceService petInvoiceService = mock(PetInvoiceService.class);
    private final PetBillingMessageSettingsService service = new PetBillingMessageSettingsService(
            settingsRepository,
            clientPlanRepository,
            petClientRepository,
            petProfileRepository,
            mock(PetAppointmentRepository.class),
            petInvoiceService
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void preparePlanRenewalMessageIncludesManualPixChargeContext() {
        UUID tenantId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        UUID petId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        ClientPlan plan = new ClientPlan();
        ReflectionTestUtils.setField(plan, "id", planId);
        plan.setTenantId(tenantId);
        plan.setClientId(clientId);
        plan.setPetId(petId);
        plan.setPlanName("Banho 4x/mes");
        plan.setTotalSessions(4);
        plan.setUsedSessions(3);
        plan.setFinalPrice(BigDecimal.valueOf(220));

        PetClient client = new PetClient();
        ReflectionTestUtils.setField(client, "id", clientId);
        client.setTenantId(tenantId);
        client.setName("Maria Responsavel");
        client.setEmail("maria@example.com");

        PetProfile pet = new PetProfile();
        ReflectionTestUtils.setField(pet, "id", petId);
        pet.setTenantId(tenantId);
        pet.setClientId(clientId);
        pet.setName("Luna");
        pet.setSpecies("Dog");

        PetBillingMessageSettings settings = new PetBillingMessageSettings();
        settings.setTenantId(tenantId);
        settings.setPixKey("pix@petshop.com.br");
        settings.setBillingDisplayName("Pet Shop Teste");

        when(clientPlanRepository.findByIdAndTenantId(planId, tenantId)).thenReturn(Optional.of(plan));
        when(petClientRepository.findByIdAndTenantId(clientId, tenantId)).thenReturn(Optional.of(client));
        when(petProfileRepository.findByIdAndTenantId(petId, tenantId)).thenReturn(Optional.of(pet));
        when(settingsRepository.findByTenantId(tenantId)).thenReturn(Optional.of(settings));
        when(petInvoiceService.ensurePlanRenewalInvoice(eq(planId), eq("Renovacao de plano PetFlow - Banho 4x/mes")))
                .thenReturn(new PetInvoiceResponse(
                        invoiceId,
                        UUID.randomUUID(),
                        clientId,
                        "Maria Responsavel",
                        BigDecimal.valueOf(220),
                        BigDecimal.ZERO,
                        BigDecimal.valueOf(220),
                        "ISSUED",
                        "Renovacao de plano PetFlow - Banho 4x/mes",
                        "PET.CLIENT_PLAN",
                        planId,
                        "Banho 4x/mes",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        List.of()
                ));

        PetPreparedCustomerMessageResponse response = service.preparePlanRenewalMessage(planId);

        assertEquals(invoiceId, response.invoiceId());
        assertEquals(BigDecimal.valueOf(220), response.invoiceOutstandingAmount());
        assertTrue(response.message().contains("O plano Banho 4x/mes do pet Luna esta no ultimo banho"));
        assertTrue(response.message().contains("o valor e R$ 220,00"));
        assertTrue(response.message().contains("PIX: pix@petshop.com.br"));
        assertTrue(response.message().contains("Favorecido: Pet Shop Teste"));
        assertTrue(response.message().contains("nos envie o comprovante"));
    }
}
