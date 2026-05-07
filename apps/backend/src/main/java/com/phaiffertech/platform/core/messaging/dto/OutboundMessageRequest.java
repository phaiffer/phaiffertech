package com.phaiffertech.platform.core.messaging.dto;

import java.util.UUID;

public record OutboundMessageRequest(
        String businessKey,
        String recipientPhone,
        String recipientName,
        String subject,
        String body,
        String relatedType,
        UUID relatedId
) {
}
