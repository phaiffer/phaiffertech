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
import com.phaiffertech.platform.core.messaging.repository.MessageChannelRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageDispatchRepository;
import com.phaiffertech.platform.core.messaging.repository.MessageTemplateMappingRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageSenderService {

    private final MessageChannelRepository channelRepository;
    private final MessageTemplateMappingRepository templateMappingRepository;
    private final MessageDispatchRepository dispatchRepository;
    private final WhatsAppProvider whatsAppProvider;
    private final SecretCipherService secretCipherService;

    public MessageSenderService(
            MessageChannelRepository channelRepository,
            MessageTemplateMappingRepository templateMappingRepository,
            MessageDispatchRepository dispatchRepository,
            WhatsAppProvider whatsAppProvider,
            SecretCipherService secretCipherService
    ) {
        this.channelRepository = channelRepository;
        this.templateMappingRepository = templateMappingRepository;
        this.dispatchRepository = dispatchRepository;
        this.whatsAppProvider = whatsAppProvider;
        this.secretCipherService = secretCipherService;
    }

    @Transactional
    public MessageDispatchResponse sendWhatsAppText(OutboundMessageRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        MessageChannel channel = channelRepository.findByTenantIdAndChannelTypeAndProvider(
                tenantId,
                MessageChannelType.WHATSAPP,
                MessageProvider.WHATSAPP_CLOUD_API
        ).orElseThrow(() -> new IllegalArgumentException("WhatsApp channel is not configured."));
        MessageTemplateMapping mapping = templateMappingRepository
                .findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(tenantId, channel.getId(), request.businessKey())
                .orElse(null);

        MessageDispatch dispatch = new MessageDispatch();
        dispatch.setTenantId(tenantId);
        dispatch.setChannelId(channel.getId());
        dispatch.setTemplateMappingId(mapping == null ? null : mapping.getId());
        dispatch.setChannelType(MessageChannelType.WHATSAPP);
        dispatch.setProvider(MessageProvider.WHATSAPP_CLOUD_API);
        dispatch.setBusinessKey(request.businessKey());
        dispatch.setRecipientPhone(normalizePhone(request.recipientPhone()));
        dispatch.setRecipientName(request.recipientName());
        dispatch.setSubject(request.subject());
        dispatch.setBody(request.body());
        dispatch.setRelatedType(request.relatedType());
        dispatch.setRelatedId(request.relatedId());

        if (!hasText(dispatch.getRecipientPhone())) {
            dispatch.setStatus(MessageDispatchStatus.FAILED);
            dispatch.setFailureReason("Recipient phone is required for WhatsApp dispatch.");
            return toResponse(dispatchRepository.save(dispatch));
        }

        String accessToken = hasText(channel.getAccessTokenSecret())
                ? secretCipherService.decrypt(channel.getAccessTokenSecret())
                : null;
        OutboundMessageRequest providerRequest = new OutboundMessageRequest(
                request.businessKey(),
                dispatch.getRecipientPhone(),
                request.recipientName(),
                request.subject(),
                request.body(),
                request.relatedType(),
                request.relatedId()
        );
        ProviderSendResult result = whatsAppProvider.sendText(channel, accessToken, providerRequest);
        dispatch.setProviderRequestPayload(result.requestPayload());
        dispatch.setProviderResponsePayload(result.responsePayload());
        dispatch.setProviderMessageId(result.providerMessageId());
        dispatch.setFailureReason(result.failureReason());
        dispatch.setStatus(result.sent() ? MessageDispatchStatus.SENT : MessageDispatchStatus.FAILED);
        dispatch.setSentAt(result.sent() ? Instant.now() : null);
        return toResponse(dispatchRepository.save(dispatch));
    }

    private MessageDispatchResponse toResponse(MessageDispatch dispatch) {
        return new MessageDispatchResponse(
                dispatch.getId(),
                dispatch.getBusinessKey(),
                dispatch.getRecipientPhone(),
                dispatch.getStatus(),
                dispatch.getProviderMessageId(),
                dispatch.getFailureReason()
        );
    }

    private String normalizePhone(String value) {
        return hasText(value) ? value.replaceAll("[^0-9+]", "").trim() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
