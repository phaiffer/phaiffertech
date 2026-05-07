package com.phaiffertech.platform.core.messaging.repository;

import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.domain.MessageChannelType;
import com.phaiffertech.platform.core.messaging.domain.MessageProvider;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageChannelRepository extends JpaRepository<MessageChannel, UUID> {

    Optional<MessageChannel> findByTenantIdAndChannelTypeAndProvider(
            UUID tenantId,
            MessageChannelType channelType,
            MessageProvider provider
    );

    Optional<MessageChannel> findFirstByPhoneNumberIdAndChannelTypeAndProvider(
            String phoneNumberId,
            MessageChannelType channelType,
            MessageProvider provider
    );
}
