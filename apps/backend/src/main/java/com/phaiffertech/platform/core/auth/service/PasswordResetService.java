package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.core.auth.config.PasswordResetProperties;
import com.phaiffertech.platform.core.auth.domain.PasswordResetToken;
import com.phaiffertech.platform.core.auth.dto.PasswordResetConfirmRequest;
import com.phaiffertech.platform.core.auth.dto.PasswordResetRequest;
import com.phaiffertech.platform.core.auth.repository.PasswordResetTokenRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_SIZE_BYTES = 32;

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TokenHashService tokenHashService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetProperties passwordResetProperties;
    private final PasswordResetMailService passwordResetMailService;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            TokenHashService tokenHashService,
            PasswordEncoder passwordEncoder,
            PasswordResetProperties passwordResetProperties,
            PasswordResetMailService passwordResetMailService,
            AuthService authService,
            AuditLogService auditLogService
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.tokenHashService = tokenHashService;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetProperties = passwordResetProperties;
        this.passwordResetMailService = passwordResetMailService;
        this.authService = authService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        Tenant tenant = tenantRepository.findByCodeIgnoreCase(request.tenantCode()).orElse(null);
        if (tenant == null) {
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        if (user == null || !user.isActive()) {
            return;
        }

        if (!userTenantRepository.existsByTenantIdAndUserIdAndActiveTrue(tenant.getId(), user.getId())) {
            return;
        }

        Instant now = Instant.now();
        invalidatePendingTokens(tenant.getId(), user.getId(), now);

        String rawToken = generateRawToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setTenantId(tenant.getId());
        token.setUserId(user.getId());
        token.setTokenHash(tokenHashService.hash(rawToken));
        token.setExpiresAt(now.plus(passwordResetProperties.getTokenExpiryMinutes(), ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(token);

        auditLogService.logEvent(
                tenant.getId(),
                user.getId(),
                "PASSWORD_RESET_REQUESTED",
                "password_reset_token",
                token.getId().toString(),
                Map.of("expiresAt", token.getExpiresAt())
        );

        try {
            passwordResetMailService.sendResetLink(tenant, user.getEmail(), rawToken, token.getExpiresAt());
        } catch (RuntimeException exception) {
            LOGGER.warn(
                    "Password reset email delivery failed for tenantId={} userId={}",
                    tenant.getId(),
                    user.getId(),
                    exception
            );
        }
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new IllegalArgumentException("New password confirmation does not match.");
        }

        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHashService.hash(request.token()))
                .orElseThrow(() -> new ForbiddenOperationException("Password reset token is invalid."));

        if (token.getUsedAt() != null) {
            throw new ForbiddenOperationException("Password reset token has already been used.");
        }

        if (token.isExpired()) {
            throw new ForbiddenOperationException("Password reset token expired.");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!user.isActive()) {
            throw new ForbiddenOperationException("Inactive users cannot reset password.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        int revokedRefreshSessions = authService.revokeAllActiveRefreshTokensForUser(user.getId());

        auditLogService.logEvent(
                token.getTenantId(),
                user.getId(),
                "PASSWORD_RESET_CONFIRMED",
                "password_reset_token",
                token.getId().toString(),
                Map.of("revokedRefreshSessions", revokedRefreshSessions)
        );
    }

    private void invalidatePendingTokens(java.util.UUID tenantId, java.util.UUID userId, Instant usedAt) {
        List<PasswordResetToken> activeTokens = passwordResetTokenRepository
                .findAllByTenantIdAndUserIdAndUsedAtIsNull(tenantId, userId);
        if (activeTokens.isEmpty()) {
            return;
        }

        activeTokens.forEach(token -> token.setUsedAt(usedAt));
        passwordResetTokenRepository.saveAll(activeTokens);
    }

    private String generateRawToken() {
        byte[] tokenBytes = new byte[TOKEN_SIZE_BYTES];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }
}
