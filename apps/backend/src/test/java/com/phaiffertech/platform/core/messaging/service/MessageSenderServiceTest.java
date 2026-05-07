package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.domain.MessageChannelType;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatch;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatchStatus;
import com.phaiffertech.platform.core.messaging.domain.MessageProvider;
import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.core.messaging.dto.OutboundMessageRequest;
import com.phaiffertech.platform.core.messaging.dto.ProviderSendResult;
import com.phaiffertech.platform.core.messaging.repository.MessageChannelRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageDispatchRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageTemplateMappingRepository;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MessageSenderServiceTest {

    private final MessageChannelRepository channelRepository = mock(MessageChannelRepository.class);
    private final MessageTemplateMappingRepository templateMappingRepository = mock(MessageTemplateMappingRepository.class);
    private final MessageDispatchRepository dispatchRepository = mock(MessageDispatchRepository.class);
    private final WhatsAppProvider whatsAppProvider = mock(WhatsAppProvider.class);
    private final MessageSenderService service = new MessageSenderService(
            channelRepository,
            templateMappingRepository,
            dispatchRepository,
            whatsAppProvider,
            new SecretCipherService(jwtProperties())
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void recordsFailedDispatchWhenProviderCannotSendWithoutCredentials() {
        UUID tenantId = UUID.randomUUID();
        UUID channelId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        MessageChannel channel = new MessageChannel();
        ReflectionTestUtils.setField(channel, "id", channelId);
        channel.setTenantId(tenantId);
        channel.setChannelType(MessageChannelType.WHATSAPP);
        channel.setProvider(MessageProvider.WHATSAPP_CLOUD_API);
        channel.setPhoneNumberId("123");
        channel.setEnabled(false);

        when(channelRepository.findByTenantIdAndChannelTypeAndProvider(tenantId, MessageChannelType.WHATSAPP, MessageProvider.WHATSAPP_CLOUD_API))
                .thenReturn(Optional.of(channel));
        when(templateMappingRepository.findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(whatsAppProvider.sendText(any(), any(), any()))
                .thenReturn(new ProviderSendResult(false, null, null, null, "WhatsApp channel is disabled."));
        when(dispatchRepository.save(any(MessageDispatch.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MessageDispatchResponse response = service.sendWhatsAppText(new OutboundMessageRequest(
                "PET_READY_PICKUP",
                "(11) 99999-9999",
                "Maria",
                "Pet ready",
                "Luna is ready",
                "PET_APPOINTMENT",
                UUID.randomUUID()
        ));

        assertEquals(MessageDispatchStatus.FAILED, response.status());
        assertEquals("11999999999", response.recipientPhone());
        assertEquals("WhatsApp channel is disabled.", response.failureReason());
    }

    private JwtProperties jwtProperties() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-with-enough-material-for-message-channel-cipher");
        return properties;
    }
}
