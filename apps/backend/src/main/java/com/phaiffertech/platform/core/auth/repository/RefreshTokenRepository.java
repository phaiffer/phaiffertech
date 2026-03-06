package com.phaiffertech.platform.core.auth.repository;

import com.phaiffertech.platform.core.auth.domain.RefreshToken;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenAndRevokedAtIsNull(String token);
}
