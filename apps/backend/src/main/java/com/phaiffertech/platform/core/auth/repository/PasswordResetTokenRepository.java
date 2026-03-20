package com.phaiffertech.platform.core.auth.repository;

import com.phaiffertech.platform.core.auth.domain.PasswordResetToken;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findAllByTenantIdAndUserIdAndUsedAtIsNull(UUID tenantId, UUID userId);
}
