package com.phaiffertech.platform.modules.pet.billing.service;

import com.phaiffertech.platform.core.messaging.domain.MessageDispatchStatus;
import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.core.messaging.dto.OutboundMessageRequest;
import com.phaiffertech.platform.core.messaging.service.MessageSenderService;
import com.phaiffertech.platform.modules.pet.billing.dto.PetPreparedCustomerMessageResponse;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetReadyMessageDispatchServiceTest {

    private final PetBillingMessageSettingsService billingMessageSettingsService = mock(PetBillingMessageSettingsService.class);
    private final MessageSenderService messageSenderService = mock(MessageSenderService.class);
    private final PetReadyMessageDispatchService service = new PetReadyMessageDispatchService(
            billingMessageSettingsService,
            messageSenderService
    );

    @Test
    void dispatchPlanRenewalUsesPreparedPixRenewalContext() {
        UUID tenantId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        UUID petId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        when(billingMessageSettingsService.preparePlanRenewalMessage(planId)).thenReturn(
                new PetPreparedCustomerMessageResponse(
                        "PLAN_RENEWAL_PIX_REMINDER",
                        tenantId,
                        clientId,
                        "Maria",
                        "maria@example.com",
                        "+55 (11) 99999-9999",
                        petId,
                        "Luna",
                        planId,
                        "Banho mensal",
                        1,
                        null,
                        "Plan renewal reminder",
                        "Ola Maria, renove Luna por R$ 220,00. PIX: pix@petshop.com.br. Favorecido: Pet Shop Teste.",
                        "pix@petshop.com.br",
                        "Pet Shop Teste",
                        invoiceId,
                        "ISSUED",
                        BigDecimal.valueOf(220),
                        BigDecimal.valueOf(220),
                        true,
                        true,
                        "Manual fallback available."
                )
        );
        MessageDispatchResponse expected = new MessageDispatchResponse(
                UUID.randomUUID(),
                "PLAN_RENEWAL_PIX_REMINDER",
                "5511999999999",
                MessageDispatchStatus.SENT,
                "wamid.renewal",
                null
        );
        when(messageSenderService.sendWhatsAppText(org.mockito.ArgumentMatchers.any())).thenReturn(expected);

        MessageDispatchResponse response = service.dispatchPlanRenewal(planId);

        assertEquals(expected, response);
        ArgumentCaptor<OutboundMessageRequest> captor = ArgumentCaptor.forClass(OutboundMessageRequest.class);
        verify(messageSenderService).sendWhatsAppText(captor.capture());
        assertEquals("PLAN_RENEWAL_PIX_REMINDER", captor.getValue().businessKey());
        assertEquals("+55 (11) 99999-9999", captor.getValue().recipientPhone());
        assertEquals("Maria", captor.getValue().recipientName());
        assertEquals("PET_CLIENT_PLAN", captor.getValue().relatedType());
        assertEquals(planId, captor.getValue().relatedId());
        assertEquals("Ola Maria, renove Luna por R$ 220,00. PIX: pix@petshop.com.br. Favorecido: Pet Shop Teste.", captor.getValue().body());
    }
}
