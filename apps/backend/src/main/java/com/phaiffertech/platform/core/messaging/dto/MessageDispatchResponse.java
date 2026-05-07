package com.phaiffertech.platform.core.messaging.dto;

import com.phaiffertech.platform.core.messaging.domain.MessageDispatchStatus;
import java.util.UUID;

public record MessageDispatchResponse(
        UUID id,
        String businessKey,
        String recipientPhone,
        MessageDispatchStatus status,
        String providerMessageId,
        String failureReason
) {
}
