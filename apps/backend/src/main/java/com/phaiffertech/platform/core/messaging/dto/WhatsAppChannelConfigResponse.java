package com.phaiffertech.platform.core.messaging.dto;

import java.util.UUID;

public record WhatsAppChannelConfigResponse(
        UUID id,
        boolean enabled,
        String displayName,
        String phoneNumberId,
        String businessAccountId,
        String providerApiVersion,
        boolean accessTokenConfigured,
        boolean webhookVerifyTokenConfigured,
        boolean readyForDispatch
) {
}
