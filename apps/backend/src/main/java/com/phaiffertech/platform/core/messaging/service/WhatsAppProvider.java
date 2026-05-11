package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.dto.ProviderSendResult;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppOutboundMessageRequest;

public interface WhatsAppProvider {

    ProviderSendResult send(MessageChannel channel, String accessToken, WhatsAppOutboundMessageRequest request);
}
