package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.dto.OutboundMessageRequest;
import com.phaiffertech.platform.core.messaging.dto.ProviderSendResult;

public interface WhatsAppProvider {

    ProviderSendResult sendText(MessageChannel channel, String accessToken, OutboundMessageRequest request);
}
