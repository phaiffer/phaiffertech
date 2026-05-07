package com.phaiffertech.platform.core.messaging.service;

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
import com.phaiffertech.platform.shared.security.JwtProperties;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MessageWebhookServiceTest {

    private final MessageChannelRepository channelRepository = mock(MessageChannelRepository.class);
    private final MessageDeliveryEventRepository deliveryEventRepository = mock(MessageDeliveryEventRepository.class);
    private final MessageDispatchRepository dispatchRepository = mock(MessageDispatchRepository.class);
    private final SecretCipherService secretCipherService = new SecretCipherService(jwtProperties());
    private final MessageWebhookService service = new MessageWebhookService(
            channelRepository,
            deliveryEventRepository,
            dispatchRepository,
            secretCipherService,
            new ObjectMapper()
    );

    @Test
    void verifiesWebhookAgainstConfiguredPhoneNumberAndProtectedToken() {
        MessageChannel channel = channel();
        channel.setWebhookVerifyTokenSecret(secretCipherService.encrypt("verify-me"));
        when(channelRepository.findFirstByPhoneNumberIdAndChannelTypeAndProvider("123", MessageChannelType.WHATSAPP, MessageProvider.WHATSAPP_CLOUD_API))
                .thenReturn(Optional.of(channel));

        Optional<String> challenge = service.verifyWebhook("123", "subscribe", "verify-me", "challenge-value");

        assertEquals(Optional.of("challenge-value"), challenge);
    }

    @Test
    void storesRawStatusWebhookAndUpdatesDispatchStatus() {
        MessageChannel channel = channel();
        MessageDispatch dispatch = new MessageDispatch();
        ReflectionTestUtils.setField(dispatch, "id", UUID.randomUUID());
        dispatch.setStatus(MessageDispatchStatus.SENT);
        when(channelRepository.findFirstByPhoneNumberIdAndChannelTypeAndProvider("123", MessageChannelType.WHATSAPP, MessageProvider.WHATSAPP_CLOUD_API))
                .thenReturn(Optional.of(channel));
        when(dispatchRepository.findFirstByProviderMessageId("wamid.1")).thenReturn(Optional.of(dispatch));
        when(deliveryEventRepository.save(any(MessageDeliveryEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String payload = """
                {"entry":[{"changes":[{"value":{"metadata":{"phone_number_id":"123"},"statuses":[{"id":"wamid.1","status":"delivered","timestamp":"1710000000"}]}}]}]}
                """;
        service.receiveWhatsAppWebhook("123", payload);

        ArgumentCaptor<MessageDeliveryEvent> eventCaptor = ArgumentCaptor.forClass(MessageDeliveryEvent.class);
        verify(deliveryEventRepository).save(eventCaptor.capture());
        verify(dispatchRepository).save(dispatch);
        assertEquals(MessageDispatchStatus.DELIVERED, dispatch.getStatus());
        assertEquals(payload, eventCaptor.getValue().getRawPayload());
        assertEquals("wamid.1", eventCaptor.getValue().getProviderMessageId());
        assertEquals(MessageDispatchStatus.DELIVERED, eventCaptor.getValue().getDeliveryStatus());
    }

    private MessageChannel channel() {
        MessageChannel channel = new MessageChannel();
        ReflectionTestUtils.setField(channel, "id", UUID.randomUUID());
        channel.setTenantId(UUID.randomUUID());
        channel.setChannelType(MessageChannelType.WHATSAPP);
        channel.setProvider(MessageProvider.WHATSAPP_CLOUD_API);
        channel.setPhoneNumberId("123");
        return channel;
    }

    private JwtProperties jwtProperties() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-with-enough-material-for-message-channel-cipher");
        return properties;
    }
}
