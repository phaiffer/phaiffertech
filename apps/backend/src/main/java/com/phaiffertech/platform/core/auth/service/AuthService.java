package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.core.auth.config.DemoAccessProperties;
import com.phaiffertech.platform.core.auth.domain.RefreshToken;
import com.phaiffertech.platform.core.auth.dto.AuthTokenResponse;
import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.ChangePasswordRequest;
import com.phaiffertech.platform.core.auth.dto.LoginRequest;
import com.phaiffertech.platform.core.auth.mapper.AuthMapper;
import com.phaiffertech.platform.core.auth.repository.RefreshTokenRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.iam.service.TenantAuthorizationResolver;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.security.JwtService;
import com.phaiffertech.platform.shared.usage.UsageTelemetryService;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import com.phaiffertech.platform.core.module.featureflag.service.FeatureFlagService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final TenantAuthorizationResolver tenantAuthorizationResolver;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenHashService refreshTokenHashService;
    private final CurrentUserService currentUserService;
    private final AuditLogService auditLogService;
    private final PlatformMetricsService platformMetricsService;
    private final UsageTelemetryService usageTelemetryService;
    private final FeatureFlagService featureFlagService;
    private final TenantEntitlementService tenantEntitlementService;
    private final DemoAccessProperties demoAccessProperties;

    public AuthService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            TenantAuthorizationResolver tenantAuthorizationResolver,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenRepository refreshTokenRepository,
            RefreshTokenHashService refreshTokenHashService,
            CurrentUserService currentUserService,
            AuditLogService auditLogService,
            PlatformMetricsService platformMetricsService,
            UsageTelemetryService usageTelemetryService,
            FeatureFlagService featureFlagService,
            TenantEntitlementService tenantEntitlementService,
            DemoAccessProperties demoAccessProperties
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.tenantAuthorizationResolver = tenantAuthorizationResolver;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenHashService = refreshTokenHashService;
        this.currentUserService = currentUserService;
        this.auditLogService = auditLogService;
        this.platformMetricsService = platformMetricsService;
        this.usageTelemetryService = usageTelemetryService;
        this.featureFlagService = featureFlagService;
        this.tenantEntitlementService = tenantEntitlementService;
        this.demoAccessProperties = demoAccessProperties;
    }

    @Transactional
    public AuthSessionResult demoLogin() {
        if (!demoAccessProperties.isEnabled()) {
            platformMetricsService.recordAuthenticationAttempt(false);
            throw new ForbiddenOperationException("Demo access is currently disabled.");
        }

        if (demoAccessProperties.isEnforceFeatureFlag()) {
            String featureFlagKey = demoAccessProperties.getFeatureFlagKey();
            if (featureFlagKey == null
                    || featureFlagKey.isBlank()
                    || !featureFlagService.isEnabled(featureFlagKey, null, false)) {
                platformMetricsService.recordAuthenticationAttempt(false);
                throw new ForbiddenOperationException("Demo access is currently disabled.");
            }
        }

        if (!demoAccessProperties.hasCredentialsConfigured()) {
            platformMetricsService.recordAuthenticationAttempt(false);
            throw new ForbiddenOperationException("Demo access is currently unavailable.");
        }

        LoginRequest request = new LoginRequest(
                demoAccessProperties.getTenantCode(),
                demoAccessProperties.getUserEmail(),
                demoAccessProperties.getUserPassword()
        );
        return this.login(request);
    }

    @Transactional
    public AuthSessionResult login(LoginRequest request) {
        Tenant tenant = tenantRepository.findByCodeIgnoreCase(request.tenantCode())
                .orElseThrow(() -> {
                    platformMetricsService.recordAuthenticationAttempt(false);
                    return new ResourceNotFoundException("Tenant not found.");
                });

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> {
                    platformMetricsService.recordAuthenticationAttempt(false);
                    return new ResourceNotFoundException("Invalid credentials.");
                });

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            platformMetricsService.recordAuthenticationAttempt(false);
            throw new ForbiddenOperationException("Invalid credentials.");
        }

        UserTenant userTenant = userTenantRepository.findByTenantIdAndUserIdAndActiveTrue(tenant.getId(), user.getId())
                .orElseThrow(() -> {
                    platformMetricsService.recordAuthenticationAttempt(false);
                    return new ForbiddenOperationException("User has no active access to tenant.");
                });

        TenantAuthorizationResolver.ResolvedTenantAuthorization resolved = tenantAuthorizationResolver.resolve(userTenant);
        AuthenticatedUser principal = new AuthenticatedUser(
                user.getId(),
                tenant.getId(),
                user.getEmail(),
                resolved.primaryRole(),
                resolved.roles(),
                resolved.permissions()
        );

        AuthSessionResult response = createTokenResponse(principal, user.getFullName(), tenant);
        platformMetricsService.recordAuthenticationAttempt(true);
        usageTelemetryService.recordLoginSuccess(tenant.getId());

        auditLogService.logEvent(
                tenant.getId(),
                user.getId(),
                "LOGIN",
                "auth",
                user.getId().toString(),
                Map.of("roles", resolved.roles())
        );

        return response;
    }

    @Transactional
    public AuthSessionResult refresh(String refreshToken) {
        String tokenHash = refreshTokenHashService.hash(refreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
                .orElseThrow(() -> new ForbiddenOperationException("Refresh token is invalid."));

        if (storedToken.isExpired()) {
            storedToken.setRevokedAt(Instant.now());
            refreshTokenRepository.save(storedToken);
            throw new ForbiddenOperationException("Refresh token expired.");
        }

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        Tenant tenant = tenantRepository.findById(storedToken.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found."));

        UserTenant userTenant = userTenantRepository.findByTenantIdAndUserIdAndActiveTrue(
                        storedToken.getTenantId(),
                        storedToken.getUserId())
                .orElseThrow(() -> new ForbiddenOperationException("User access revoked for tenant."));

        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        TenantAuthorizationResolver.ResolvedTenantAuthorization resolved = tenantAuthorizationResolver.resolve(userTenant);
        AuthenticatedUser principal = new AuthenticatedUser(
                user.getId(),
                storedToken.getTenantId(),
                user.getEmail(),
                resolved.primaryRole(),
                resolved.roles(),
                resolved.permissions()
        );

        AuthSessionResult response = createTokenResponse(principal, user.getFullName(), tenant);

        auditLogService.logEvent(
                storedToken.getTenantId(),
                user.getId(),
                "REFRESH_TOKEN",
                "refresh_tokens",
                storedToken.getId().toString(),
                Map.of("rotated", true, "roles", resolved.roles())
        );

        return response;
    }

    @Transactional
    public void logout(String refreshToken) {
        String tokenHash = refreshTokenHashService.hash(refreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
                .orElseThrow(() -> new ForbiddenOperationException("Refresh token is invalid."));

        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        auditLogService.logEvent(
                storedToken.getTenantId(),
                storedToken.getUserId(),
                "LOGOUT",
                "refresh_tokens",
                storedToken.getId().toString(),
                null
        );
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        AuthenticatedUser authenticatedUser = currentUserService.getRequiredUser();
        User user = userRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (!user.isActive()) {
            throw new ForbiddenOperationException("Inactive users cannot change password.");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ForbiddenOperationException("Current password is incorrect.");
        }

        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new IllegalArgumentException("New password confirmation does not match.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        int revokedRefreshSessions = revokeAllActiveRefreshTokensForUser(authenticatedUser.userId());

        auditLogService.logEvent(
                authenticatedUser.tenantId(),
                authenticatedUser.userId(),
                "CHANGE_PASSWORD",
                "auth",
                authenticatedUser.userId().toString(),
                Map.of("revokedRefreshSessions", revokedRefreshSessions)
        );
    }

    @Transactional(readOnly = true)
    public AuthenticatedUserResponse me() {
        AuthenticatedUser authenticatedUser = currentUserService.getRequiredUser();
        User user = userRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
        Tenant tenant = tenantRepository.findById(authenticatedUser.tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated tenant not found."));

        return AuthMapper.toAuthenticatedUserResponse(
                user,
                authenticatedUser,
                tenant,
                tenantEntitlementService.resolveEffectiveEntitlements(tenant.getId())
        );
    }

    private AuthSessionResult createTokenResponse(AuthenticatedUser principal, String fullName, Tenant tenant) {
        revokeActiveRefreshTokens(principal.tenantId(), principal.userId());

        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();

        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setTenantId(principal.tenantId());
        refreshTokenEntity.setUserId(principal.userId());
        refreshTokenEntity.setTokenHash(refreshTokenHashService.hash(refreshToken));
        refreshTokenEntity.setExpiresAt(jwtService.getRefreshExpiration());
        refreshTokenRepository.save(refreshTokenEntity);

        AuthenticatedUserResponse userResponse = AuthMapper.toAuthenticatedUserResponse(
                principal,
                fullName,
                tenant,
                tenantEntitlementService.resolveEffectiveEntitlements(tenant.getId())
        );

        return new AuthSessionResult(
                new AuthTokenResponse(
                        accessToken,
                        jwtProperties.getAccessMinutes() * 60,
                        userResponse
                ),
                refreshToken
        );
    }

    // Refresh-token revocation is the current server-side credential invalidation control point.
    // Access tokens stay valid until expiry because they are stateless in the existing architecture.
    private int revokeAllActiveRefreshTokensForUser(UUID userId) {
        Instant revokedAt = Instant.now();
        var activeTokens = refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId);
        if (activeTokens.isEmpty()) {
            return 0;
        }

        activeTokens.forEach(token -> token.setRevokedAt(revokedAt));
        refreshTokenRepository.saveAll(activeTokens);
        return activeTokens.size();
    }

    private void revokeActiveRefreshTokens(UUID tenantId, UUID userId) {
        Instant revokedAt = Instant.now();
        var activeTokens = refreshTokenRepository.findAllByTenantIdAndUserIdAndRevokedAtIsNull(tenantId, userId);
        if (activeTokens.isEmpty()) {
            return;
        }

        activeTokens.forEach(token -> token.setRevokedAt(revokedAt));
        refreshTokenRepository.saveAll(activeTokens);
    }

    public record AuthSessionResult(AuthTokenResponse response, String refreshToken) {
    }
}
