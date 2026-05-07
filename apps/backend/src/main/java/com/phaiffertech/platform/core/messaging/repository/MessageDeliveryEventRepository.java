package com.phaiffertech.platform.core.messaging.repository;

import com.phaiffertech.platform.core.messaging.domain.MessageDeliveryEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageDeliveryEventRepository extends JpaRepository<MessageDeliveryEvent, UUID> {
}
