package com.phaiffertech.platform.core.messaging.repository;

import com.phaiffertech.platform.core.messaging.domain.MessageDispatch;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageDispatchRepository extends JpaRepository<MessageDispatch, UUID> {

    Optional<MessageDispatch> findFirstByProviderMessageId(String providerMessageId);

    Optional<MessageDispatch> findByIdAndTenantId(UUID id, UUID tenantId);
}
