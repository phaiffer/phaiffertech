package com.phaiffertech.platform.core.messaging.repository;

import com.phaiffertech.platform.core.messaging.domain.MessageTemplateMapping;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageTemplateMappingRepository extends JpaRepository<MessageTemplateMapping, UUID> {

    Optional<MessageTemplateMapping> findByTenantIdAndChannelIdAndBusinessKeyAndActiveTrue(
            UUID tenantId,
            UUID channelId,
            String businessKey
    );
}
