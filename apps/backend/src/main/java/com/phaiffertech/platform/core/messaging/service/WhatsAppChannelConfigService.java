package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.domain.MessageChannelType;
import com.phaiffertech.platform.core.messaging.domain.MessageProvider;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppChannelConfigRequest;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppChannelConfigResponse;
import com.phaiffertech.platform.core.messaging.repository.MessageChannelRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppChannelConfigService {

    private final MessageChannelRepository channelRepository;
    private final SecretCipherService secretCipherService;

    public WhatsAppChannelConfigService(
            MessageChannelRepository channelRepository,
            SecretCipherService secretCipherService
    ) {
        this.channelRepository = channelRepository;
        this.secretCipherService = secretCipherService;
    }

    @Transactional(readOnly = true)
    public WhatsAppChannelConfigResponse getCurrentTenantConfig() {
        UUID tenantId = TenantContext.getRequiredTenantId();
        MessageChannel channel = channelRepository.findByTenantIdAndChannelTypeAndProvider(
                tenantId,
                MessageChannelType.WHATSAPP,
                MessageProvider.WHATSAPP_CLOUD_API
        ).orElseGet(() -> defaultChannel(tenantId));
        return toResponse(channel);
    }

    @Transactional
    public WhatsAppChannelConfigResponse updateCurrentTenantConfig(WhatsAppChannelConfigRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        MessageChannel channel = channelRepository.findByTenantIdAndChannelTypeAndProvider(
                tenantId,
                MessageChannelType.WHATSAPP,
                MessageProvider.WHATSAPP_CLOUD_API
        ).orElseGet(() -> defaultChannel(tenantId));

        channel.setEnabled(Boolean.TRUE.equals(request.enabled()));
        channel.setDisplayName(normalizeOptional(request.displayName()));
        channel.setPhoneNumberId(normalizeOptional(request.phoneNumberId()));
        channel.setBusinessAccountId(normalizeOptional(request.businessAccountId()));
        channel.setProviderApiVersion(hasText(request.providerApiVersion()) ? request.providerApiVersion().trim() : "v25.0");
        if (hasText(request.accessToken())) {
            channel.setAccessTokenSecret(secretCipherService.encrypt(request.accessToken()));
        }
        if (hasText(request.webhookVerifyToken())) {
            channel.setWebhookVerifyTokenSecret(secretCipherService.encrypt(request.webhookVerifyToken()));
        }
        return toResponse(channelRepository.save(channel));
    }

    private MessageChannel defaultChannel(UUID tenantId) {
        MessageChannel channel = new MessageChannel();
        channel.setTenantId(tenantId);
        channel.setChannelType(MessageChannelType.WHATSAPP);
        channel.setProvider(MessageProvider.WHATSAPP_CLOUD_API);
        channel.setProviderApiVersion("v25.0");
        return channel;
    }

    private WhatsAppChannelConfigResponse toResponse(MessageChannel channel) {
        boolean accessTokenConfigured = hasText(channel.getAccessTokenSecret());
        boolean verifyTokenConfigured = hasText(channel.getWebhookVerifyTokenSecret());
        boolean ready = channel.isEnabled() && hasText(channel.getPhoneNumberId()) && accessTokenConfigured;
        return new WhatsAppChannelConfigResponse(
                channel.getId(),
                channel.isEnabled(),
                channel.getDisplayName(),
                channel.getPhoneNumberId(),
                channel.getBusinessAccountId(),
                channel.getProviderApiVersion(),
                accessTokenConfigured,
                verifyTokenConfigured,
                ready
        );
    }

    private String normalizeOptional(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
