package com.phaiffertech.platform.core.auth.repository;

import com.phaiffertech.platform.core.auth.domain.RefreshToken;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);

    List<RefreshToken> findAllByTenantIdAndUserIdAndRevokedAtIsNull(UUID tenantId, UUID userId);

    int deleteByExpiresAtBefore(Instant expiresAt);
}
