package com.phaiffertech.platform.core.auth.repository;

import com.phaiffertech.platform.core.auth.domain.SupportImpersonationSession;
import com.phaiffertech.platform.core.auth.domain.SupportImpersonationStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportImpersonationSessionRepository extends JpaRepository<SupportImpersonationSession, UUID> {

    Optional<SupportImpersonationSession> findByIdAndPlatformAdminUserId(UUID id, UUID platformAdminUserId);

    Optional<SupportImpersonationSession> findFirstByPlatformAdminUserIdAndStatusAndEndedAtIsNullOrderByStartedAtDesc(
            UUID platformAdminUserId,
            SupportImpersonationStatus status
    );
}
