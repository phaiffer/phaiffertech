package com.phaiffertech.platform.core.messaging.dto;

public record ProviderSendResult(
        boolean sent,
        String providerMessageId,
        String requestPayload,
        String responsePayload,
        String failureReason
) {
}
