package com.phaiffertech.platform.core.messaging.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.domain.MessageChannelType;
import com.phaiffertech.platform.core.messaging.domain.MessageDeliveryEvent;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatch;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatchStatus;
import com.phaiffertech.platform.core.messaging.domain.MessageProvider;
import com.phaiffertech.platform.core.messaging.repository.MessageChannelRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageDeliveryEventRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageDispatchRepository;
import java.io.IOException;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageWebhookService {

    private final MessageChannelRepository channelRepository;
    private final MessageDeliveryEventRepository deliveryEventRepository;
    private final MessageDispatchRepository dispatchRepository;
    private final SecretCipherService secretCipherService;
    private final ObjectMapper objectMapper;

    public MessageWebhookService(
            MessageChannelRepository channelRepository,
            MessageDeliveryEventRepository deliveryEventRepository,
            MessageDispatchRepository dispatchRepository,
            SecretCipherService secretCipherService,
            ObjectMapper objectMapper
    ) {
        this.channelRepository = channelRepository;
        this.deliveryEventRepository = deliveryEventRepository;
        this.dispatchRepository = dispatchRepository;
        this.secretCipherService = secretCipherService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Optional<String> verifyWebhook(String phoneNumberId, String mode, String verifyToken, String challenge) {
        if (!"subscribe".equals(mode) || !hasText(verifyToken) || !hasText(challenge)) {
            return Optional.empty();
        }
        return channelRepository.findFirstByPhoneNumberIdAndChannelTypeAndProvider(
                        phoneNumberId,
                        MessageChannelType.WHATSAPP,
                        MessageProvider.WHATSAPP_CLOUD_API
                )
                .filter(channel -> tokenMatches(channel, verifyToken))
                .map(ignored -> challenge);
    }

    @Transactional
    public void receiveWhatsAppWebhook(String phoneNumberId, String rawPayload) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            for (JsonNode entry : root.path("entry")) {
                for (JsonNode change : entry.path("changes")) {
                    JsonNode value = change.path("value");
                    String payloadPhoneNumberId = value.path("metadata").path("phone_number_id").asText(phoneNumberId);
                    MessageChannel channel = resolveChannel(payloadPhoneNumberId);
                    saveStatusEvents(channel, value, rawPayload);
                    saveInboundMessageEvents(channel, value, rawPayload);
                }
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid WhatsApp webhook payload.", ex);
        }
    }

    private void saveStatusEvents(MessageChannel channel, JsonNode value, String rawPayload) {
        for (JsonNode statusNode : value.path("statuses")) {
            String providerMessageId = statusNode.path("id").asText(null);
            MessageDispatchStatus status = mapStatus(statusNode.path("status").asText(null));
            MessageDispatch dispatch = providerMessageId == null
                    ? null
                    : dispatchRepository.findFirstByProviderMessageId(providerMessageId).orElse(null);

            MessageDeliveryEvent event = baseEvent(channel, rawPayload);
            event.setDispatchId(dispatch == null ? null : dispatch.getId());
            event.setProviderMessageId(providerMessageId);
            event.setProviderEventType("status");
            event.setDeliveryStatus(status);
            event.setOccurredAt(resolveOccurredAt(statusNode.path("timestamp").asText(null)));
            deliveryEventRepository.save(event);

            if (dispatch != null && status != null) {
                dispatch.setStatus(status);
                dispatchRepository.save(dispatch);
            }
        }
    }

    private void saveInboundMessageEvents(MessageChannel channel, JsonNode value, String rawPayload) {
        for (JsonNode messageNode : value.path("messages")) {
            MessageDeliveryEvent event = baseEvent(channel, rawPayload);
            event.setProviderMessageId(messageNode.path("id").asText(null));
            event.setProviderEventType("message");
            event.setOccurredAt(resolveOccurredAt(messageNode.path("timestamp").asText(null)));
            deliveryEventRepository.save(event);
        }
    }

    private MessageDeliveryEvent baseEvent(MessageChannel channel, String rawPayload) {
        MessageDeliveryEvent event = new MessageDeliveryEvent();
        event.setTenantId(channel.getTenantId());
        event.setChannelId(channel.getId());
        event.setChannelType(MessageChannelType.WHATSAPP);
        event.setProvider(MessageProvider.WHATSAPP_CLOUD_API);
        event.setRawPayload(rawPayload);
        return event;
    }

    private MessageChannel resolveChannel(String phoneNumberId) {
        return channelRepository.findFirstByPhoneNumberIdAndChannelTypeAndProvider(
                phoneNumberId,
                MessageChannelType.WHATSAPP,
                MessageProvider.WHATSAPP_CLOUD_API
        ).orElseThrow(() -> new IllegalArgumentException("WhatsApp channel not found for webhook phone number id."));
    }

    private boolean tokenMatches(MessageChannel channel, String verifyToken) {
        if (!hasText(channel.getWebhookVerifyTokenSecret())) {
            return false;
        }
        return verifyToken.equals(secretCipherService.decrypt(channel.getWebhookVerifyTokenSecret()));
    }

    private MessageDispatchStatus mapStatus(String value) {
        if ("sent".equalsIgnoreCase(value)) {
            return MessageDispatchStatus.SENT;
        }
        if ("delivered".equalsIgnoreCase(value)) {
            return MessageDispatchStatus.DELIVERED;
        }
        if ("read".equalsIgnoreCase(value)) {
            return MessageDispatchStatus.READ;
        }
        if ("failed".equalsIgnoreCase(value)) {
            return MessageDispatchStatus.FAILED;
        }
        return null;
    }

    private Instant resolveOccurredAt(String timestamp) {
        if (!hasText(timestamp)) {
            return null;
        }
        try {
            return Instant.ofEpochSecond(Long.parseLong(timestamp));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
