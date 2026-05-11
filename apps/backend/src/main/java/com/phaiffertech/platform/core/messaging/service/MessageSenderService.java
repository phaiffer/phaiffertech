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
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
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
        String normalizedPhone = normalizePhone(request.recipientPhone());
        dispatch.setRecipientPhone(normalizedPhone == null ? "" : normalizedPhone);
        dispatch.setRecipientName(request.recipientName());
        dispatch.setSubject(request.subject());
        dispatch.setBody(request.body());
        dispatch.setRelatedType(request.relatedType());
        dispatch.setRelatedId(request.relatedId());
        dispatch.setStatus(MessageDispatchStatus.PENDING);
        dispatch = dispatchRepository.save(dispatch);

        if (!isValidWhatsAppPhone(normalizedPhone)) {
            dispatch.setStatus(MessageDispatchStatus.FAILED);
            dispatch.setFailureReason("Recipient phone must include 10 to 15 digits for WhatsApp dispatch.");
            return toResponse(dispatchRepository.save(dispatch));
        }

        String accessToken = hasText(channel.getAccessTokenSecret())
                ? secretCipherService.decrypt(channel.getAccessTokenSecret())
                : null;
        WhatsAppOutboundMessageRequest providerRequest = new WhatsAppOutboundMessageRequest(
                request.businessKey(),
                dispatch.getRecipientPhone(),
                request.recipientName(),
                request.subject(),
                request.body(),
                request.relatedType(),
                request.relatedId(),
                mapping == null ? null : mapping.getProviderTemplateName(),
                mapping == null ? null : mapping.getProviderTemplateLanguage()
        );
        ProviderSendResult result = whatsAppProvider.send(channel, accessToken, providerRequest);
        dispatch.setProviderRequestPayload(result.requestPayload());
        dispatch.setProviderResponsePayload(result.responsePayload());
        dispatch.setProviderMessageId(result.providerMessageId());
        dispatch.setFailureReason(result.failureReason());
        dispatch.setStatus(result.sent() ? MessageDispatchStatus.SENT : MessageDispatchStatus.FAILED);
        dispatch.setSentAt(result.sent() ? Instant.now() : null);
        return toResponse(dispatchRepository.save(dispatch));
    }

    @Transactional(readOnly = true)
    public MessageDispatchResponse getCurrentTenantDispatch(UUID dispatchId) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        return dispatchRepository.findByIdAndTenantId(dispatchId, tenantId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Message dispatch not found."));
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
        return hasText(value) ? value.replaceAll("\\D", "").trim() : null;
    }

    private boolean isValidWhatsAppPhone(String value) {
        return hasText(value) && value.length() >= 10 && value.length() <= 15;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
