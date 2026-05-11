package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.domain.MessageChannelType;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatch;
import com.phaiffertech.platform.core.messaging.domain.MessageDispatchStatus;
import com.phaiffertech.platform.core.messaging.domain.MessageProvider;
import com.phaiffertech.platform.core.messaging.domain.MessageTemplateMapping;
import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.core.messaging.dto.OutboundMessageRequest;
import com.phaiffertech.platform.core.messaging.dto.ProviderSendResult;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppOutboundMessageRequest;
import com.phaiffertech.platform.core.messaging.repository.MessageChannelRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageDispatchRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageTemplateMappingRepository;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MessageSenderServiceTest {

    private final MessageChannelRepository channelRepository = mock(MessageChannelRepository.class);
    private final MessageTemplateMappingRepository templateMappingRepository = mock(MessageTemplateMappingRepository.class);
    private final MessageDispatchRepository dispatchRepository = mock(MessageDispatchRepository.class);
    private final WhatsAppProvider whatsAppProvider = mock(WhatsAppProvider.class);
    private final SecretCipherService secretCipherService = new SecretCipherService(jwtProperties());
    private final MessageSenderService service = new MessageSenderService(
            channelRepository,
            templateMappingRepository,
            dispatchRepository,
            whatsAppProvider,
            secretCipherService
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void rejectsInvalidRecipientPhoneAndKeepsFailedDispatch() {
        UUID tenantId = UUID.randomUUID();
        MessageChannel channel = configuredChannel(tenantId);
        TenantContext.setTenantId(tenantId);
        mockChannel(channel);
        when(templateMappingRepository.findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(dispatchRepository.save(any(MessageDispatch.class))).thenAnswer(invocation -> withId(invocation.getArgument(0)));

        MessageDispatchResponse response = service.sendWhatsAppText(request("123"));

        assertNotNull(response.id());
        assertEquals(MessageDispatchStatus.FAILED, response.status());
        assertEquals("123", response.recipientPhone());
        assertEquals("Recipient phone must include 10 to 15 digits for WhatsApp dispatch.", response.failureReason());
        verify(whatsAppProvider, never()).send(any(), any(), any());
    }

    @Test
    void recordsFailedDispatchWhenChannelHasNoCredentials() {
        UUID tenantId = UUID.randomUUID();
        MessageChannel channel = configuredChannel(tenantId);
        channel.setAccessTokenSecret(null);
        TenantContext.setTenantId(tenantId);
        mockChannel(channel);
        when(templateMappingRepository.findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(whatsAppProvider.send(any(), any(), any()))
                .thenReturn(new ProviderSendResult(false, null, null, null, "WhatsApp credentials are not configured."));
        when(dispatchRepository.save(any(MessageDispatch.class))).thenAnswer(invocation -> withId(invocation.getArgument(0)));

        MessageDispatchResponse response = service.sendWhatsAppText(request("(11) 99999-9999"));

        assertEquals(MessageDispatchStatus.FAILED, response.status());
        assertEquals("11999999999", response.recipientPhone());
        assertEquals("WhatsApp credentials are not configured.", response.failureReason());
    }

    @Test
    void createsPendingDispatchBeforeProviderCallAndMapsLogicalTemplate() {
        UUID tenantId = UUID.randomUUID();
        UUID mappingId = UUID.randomUUID();
        MessageChannel channel = configuredChannel(tenantId);
        MessageTemplateMapping mapping = new MessageTemplateMapping();
        ReflectionTestUtils.setField(mapping, "id", mappingId);
        mapping.setTenantId(tenantId);
        mapping.setChannelId(channel.getId());
        mapping.setBusinessKey("PET_READY_PICKUP");
        mapping.setProviderTemplateName("pet_ready_pickup");
        mapping.setProviderTemplateLanguage("pt_BR");
        TenantContext.setTenantId(tenantId);
        mockChannel(channel);
        when(templateMappingRepository.findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(tenantId, channel.getId(), "PET_READY_PICKUP"))
                .thenReturn(Optional.of(mapping));
        when(whatsAppProvider.send(any(), any(), any()))
                .thenReturn(new ProviderSendResult(true, "wamid.123", "{\"sent\":true}", "{\"messages\":[{\"id\":\"wamid.123\"}]}", null));
        List<MessageDispatchStatus> savedStatuses = new ArrayList<>();
        when(dispatchRepository.save(any(MessageDispatch.class))).thenAnswer(invocation -> {
            MessageDispatch dispatch = invocation.getArgument(0);
            savedStatuses.add(dispatch.getStatus());
            return withId(dispatch);
        });

        MessageDispatchResponse response = service.sendWhatsAppText(request("+55 (11) 99999-9999"));

        assertEquals(MessageDispatchStatus.SENT, response.status());
        assertEquals("5511999999999", response.recipientPhone());
        assertEquals("wamid.123", response.providerMessageId());

        ArgumentCaptor<MessageDispatch> dispatchCaptor = ArgumentCaptor.forClass(MessageDispatch.class);
        verify(dispatchRepository, org.mockito.Mockito.times(2)).save(dispatchCaptor.capture());
        assertEquals(MessageDispatchStatus.PENDING, savedStatuses.get(0));
        assertEquals(MessageDispatchStatus.SENT, savedStatuses.get(1));
        assertEquals(mappingId, dispatchCaptor.getAllValues().get(0).getTemplateMappingId());

        ArgumentCaptor<WhatsAppOutboundMessageRequest> providerCaptor =
                ArgumentCaptor.forClass(WhatsAppOutboundMessageRequest.class);
        verify(whatsAppProvider).send(any(), any(), providerCaptor.capture());
        assertEquals("pet_ready_pickup", providerCaptor.getValue().providerTemplateName());
        assertEquals("pt_BR", providerCaptor.getValue().providerTemplateLanguage());
    }

    @Test
    void storesProviderFailureOnDispatch() {
        UUID tenantId = UUID.randomUUID();
        MessageChannel channel = configuredChannel(tenantId);
        TenantContext.setTenantId(tenantId);
        mockChannel(channel);
        when(templateMappingRepository.findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(whatsAppProvider.send(any(), any(), any()))
                .thenReturn(new ProviderSendResult(false, null, "{\"to\":\"11999999999\"}", "{\"error\":true}", "WhatsApp Cloud API rejected the dispatch with HTTP 400."));
        when(dispatchRepository.save(any(MessageDispatch.class))).thenAnswer(invocation -> withId(invocation.getArgument(0)));

        MessageDispatchResponse response = service.sendWhatsAppText(request("11999999999"));

        assertEquals(MessageDispatchStatus.FAILED, response.status());
        assertEquals("WhatsApp Cloud API rejected the dispatch with HTTP 400.", response.failureReason());
    }

    private void mockChannel(MessageChannel channel) {
        when(channelRepository.findByTenantIdAndChannelTypeAndProvider(
                channel.getTenantId(),
                MessageChannelType.WHATSAPP,
                MessageProvider.WHATSAPP_CLOUD_API
        )).thenReturn(Optional.of(channel));
    }

    private MessageChannel configuredChannel(UUID tenantId) {
        MessageChannel channel = new MessageChannel();
        ReflectionTestUtils.setField(channel, "id", UUID.randomUUID());
        channel.setTenantId(tenantId);
        channel.setChannelType(MessageChannelType.WHATSAPP);
        channel.setProvider(MessageProvider.WHATSAPP_CLOUD_API);
        channel.setPhoneNumberId("123456");
        channel.setAccessTokenSecret(secretCipherService.encrypt("test-access-token"));
        channel.setEnabled(true);
        return channel;
    }

    private MessageDispatch withId(MessageDispatch dispatch) {
        if (dispatch.getId() == null) {
            ReflectionTestUtils.setField(dispatch, "id", UUID.randomUUID());
        }
        return dispatch;
    }

    private OutboundMessageRequest request(String phone) {
        return new OutboundMessageRequest(
                "PET_READY_PICKUP",
                phone,
                "Maria",
                "Pet ready",
                "Luna is ready for pickup.",
                "PET_APPOINTMENT",
                UUID.randomUUID()
        );
    }

    private JwtProperties jwtProperties() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-with-enough-material-for-message-channel-cipher");
        return properties;
    }
}
