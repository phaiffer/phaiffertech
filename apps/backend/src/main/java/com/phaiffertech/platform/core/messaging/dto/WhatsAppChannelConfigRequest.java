package com.phaiffertech.platform.core.messaging.dto;

import jakarta.validation.constraints.Size;

public record WhatsAppChannelConfigRequest(
        Boolean enabled,
        @Size(max = 120) String displayName,
        @Size(max = 120) String phoneNumberId,
        @Size(max = 120) String businessAccountId,
        String accessToken,
        String webhookVerifyToken,
        @Size(max = 24) String providerApiVersion
) {
}
