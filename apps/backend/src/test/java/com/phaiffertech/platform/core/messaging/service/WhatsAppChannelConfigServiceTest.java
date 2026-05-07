package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppChannelConfigRequest;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppChannelConfigResponse;
import com.phaiffertech.platform.core.messaging.repository.MessageChannelRepository;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WhatsAppChannelConfigServiceTest {

    private final MessageChannelRepository channelRepository = mock(MessageChannelRepository.class);
    private final SecretCipherService secretCipherService = new SecretCipherService(jwtProperties());
    private final WhatsAppChannelConfigService service = new WhatsAppChannelConfigService(
            channelRepository,
            secretCipherService
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void updateStoresSecretsProtectedAndResponseOnlyShowsConfiguredFlags() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        when(channelRepository.findByTenantIdAndChannelTypeAndProvider(any(), any(), any())).thenReturn(Optional.empty());
        when(channelRepository.save(any(MessageChannel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WhatsAppChannelConfigResponse response = service.updateCurrentTenantConfig(new WhatsAppChannelConfigRequest(
                true,
                "PetFlow WhatsApp",
                "123456789",
                "987654321",
                "secret-access-token",
                "verify-me",
                "v25.0"
        ));

        assertTrue(response.accessTokenConfigured());
        assertTrue(response.webhookVerifyTokenConfigured());
        assertTrue(response.readyForDispatch());
        assertEquals("123456789", response.phoneNumberId());
    }

    @Test
    void cipherRoundTripDoesNotStorePlainText() {
        String protectedValue = secretCipherService.encrypt("secret-access-token");

        assertNotEquals("secret-access-token", protectedValue);
        assertEquals("secret-access-token", secretCipherService.decrypt(protectedValue));
    }

    private JwtProperties jwtProperties() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-with-enough-material-for-message-channel-cipher");
        return properties;
    }
}
