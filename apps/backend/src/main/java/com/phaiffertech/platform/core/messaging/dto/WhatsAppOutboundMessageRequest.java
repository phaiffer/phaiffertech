package com.phaiffertech.platform.core.messaging.dto;

import java.util.UUID;

public record WhatsAppOutboundMessageRequest(
        String businessKey,
        String recipientPhone,
        String recipientName,
        String subject,
        String body,
        String relatedType,
        UUID relatedId,
        String providerTemplateName,
        String providerTemplateLanguage
) {
}
