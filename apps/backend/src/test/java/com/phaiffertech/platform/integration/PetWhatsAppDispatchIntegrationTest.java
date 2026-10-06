package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatchStatus;
import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.modules.pet.billing.service.PetReadyMessageDispatchService;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetWhatsAppDispatchIntegrationTest extends AbstractIntegrationTest {

    @MockitoBean
    private PetReadyMessageDispatchService dispatchService;

    @Test
    void shouldKeepPetWhatsAppDispatchRoutesAndPermissions() {
        String marker = randomSearchMarker();
        AuthSession appointmentSession = createTenantSessionWithPermissions(
                "pet-whatsapp-appointment-" + marker,
                "pet-whatsapp-appointment-" + marker + "@local.test",
                List.of("pet.appointment.update"),
                "PET"
        );
        AuthSession planSession = createTenantSessionWithPermissions(
                "pet-whatsapp-plan-" + marker,
                "pet-whatsapp-plan-" + marker + "@local.test",
                List.of("pet.plan.read"),
                "PET"
        );
        AuthSession withoutPetEntitlement = createTenantSessionWithPermissions(
                "pet-whatsapp-no-entitlement-" + marker,
                "pet-whatsapp-no-entitlement-" + marker + "@local.test",
                List.of("pet.appointment.update", "pet.plan.read"),
                "CORE_PLATFORM"
        );

        UUID appointmentId = UUID.randomUUID();
        MessageDispatchResponse petReadyDispatch = new MessageDispatchResponse(
                UUID.randomUUID(), "PET_READY_PICKUP", "5511999999999", MessageDispatchStatus.SENT, "wamid.pickup", null
        );
        when(dispatchService.dispatchPetReady(appointmentId)).thenReturn(petReadyDispatch);
        ResponseEntity<JsonNode> petReady = post(
                "/messages/whatsapp/pet-ready",
                Map.of("appointmentId", appointmentId),
                appointmentSession
        );
        assertEquals(200, petReady.getStatusCode().value());
        assertEquals(petReadyDispatch.id().toString(), requireBody(petReady).path("data").path("id").asText());
        assertEquals("PET_READY_PICKUP", requireBody(petReady).path("data").path("businessKey").asText());

        ResponseEntity<JsonNode> petReadyWithoutPermission = post(
                "/messages/whatsapp/pet-ready",
                Map.of("appointmentId", appointmentId),
                planSession
        );
        assertEquals(403, petReadyWithoutPermission.getStatusCode().value());
        assertEquals("FORBIDDEN", requireBody(petReadyWithoutPermission).path("code").asText());

        ResponseEntity<JsonNode> petReadyWithoutEntitlement = post(
                "/messages/whatsapp/pet-ready",
                Map.of("appointmentId", appointmentId),
                withoutPetEntitlement
        );
        assertEquals(403, petReadyWithoutEntitlement.getStatusCode().value());
        assertEquals("Missing tenant entitlement from set: pet.aesthetics",
                requireBody(petReadyWithoutEntitlement).path("message").asText());
        verify(dispatchService).dispatchPetReady(appointmentId);

        UUID planId = UUID.randomUUID();
        MessageDispatchResponse planRenewalDispatch = new MessageDispatchResponse(
                UUID.randomUUID(), "PLAN_RENEWAL_PIX_REMINDER", "5511999999999", MessageDispatchStatus.SENT,
                "wamid.renewal", null
        );
        when(dispatchService.dispatchPlanRenewal(planId)).thenReturn(planRenewalDispatch);
        ResponseEntity<JsonNode> planRenewal = post(
                "/messages/whatsapp/plan-renewal",
                Map.of("planId", planId),
                planSession
        );
        assertEquals(200, planRenewal.getStatusCode().value());
        assertEquals(planRenewalDispatch.id().toString(), requireBody(planRenewal).path("data").path("id").asText());
        assertEquals("PLAN_RENEWAL_PIX_REMINDER", requireBody(planRenewal).path("data").path("businessKey").asText());

        ResponseEntity<JsonNode> planRenewalWithoutPermission = post(
                "/messages/whatsapp/plan-renewal",
                Map.of("planId", planId),
                appointmentSession
        );
        assertEquals(403, planRenewalWithoutPermission.getStatusCode().value());
        assertEquals("FORBIDDEN", requireBody(planRenewalWithoutPermission).path("code").asText());

        ResponseEntity<JsonNode> planRenewalWithoutEntitlement = post(
                "/messages/whatsapp/plan-renewal",
                Map.of("planId", planId),
                withoutPetEntitlement
        );
        assertEquals(403, planRenewalWithoutEntitlement.getStatusCode().value());
        assertEquals("Missing tenant entitlement from set: pet.aesthetics",
                requireBody(planRenewalWithoutEntitlement).path("message").asText());
        verify(dispatchService).dispatchPlanRenewal(planId);
    }
}
