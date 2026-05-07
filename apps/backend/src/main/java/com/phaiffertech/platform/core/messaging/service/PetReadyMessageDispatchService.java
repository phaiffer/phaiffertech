package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.core.messaging.dto.OutboundMessageRequest;
import com.phaiffertech.platform.modules.pet.billing.dto.PetPreparedCustomerMessageResponse;
import com.phaiffertech.platform.modules.pet.billing.service.PetBillingMessageSettingsService;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PetReadyMessageDispatchService {

    private final PetBillingMessageSettingsService petBillingMessageSettingsService;
    private final MessageSenderService messageSenderService;

    public PetReadyMessageDispatchService(
            PetBillingMessageSettingsService petBillingMessageSettingsService,
            MessageSenderService messageSenderService
    ) {
        this.petBillingMessageSettingsService = petBillingMessageSettingsService;
        this.messageSenderService = messageSenderService;
    }

    public MessageDispatchResponse dispatchPetReady(UUID appointmentId) {
        PetPreparedCustomerMessageResponse prepared = petBillingMessageSettingsService.preparePetReadyMessage(appointmentId);
        return messageSenderService.sendWhatsAppText(new OutboundMessageRequest(
                prepared.type(),
                prepared.clientPhone(),
                prepared.clientName(),
                prepared.subject(),
                prepared.message(),
                "PET_APPOINTMENT",
                prepared.appointmentId()
        ));
    }
}
