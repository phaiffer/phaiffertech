package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.core.auth.domain.RefreshToken;
import com.phaiffertech.platform.core.auth.dto.AuthTokenResponse;
import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.LoginRequest;
import com.phaiffertech.platform.core.auth.dto.LogoutRequest;
import com.phaiffertech.platform.core.auth.dto.RefreshRequest;
import com.phaiffertech.platform.core.auth.mapper.AuthMapper;
import com.phaiffertech.platform.core.auth.repository.RefreshTokenRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.iam.service.TenantAuthorizationResolver;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.security.JwtService;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
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
            AuditLogService auditLogService
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
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        Tenant tenant = tenantRepository.findByCodeIgnoreCase(request.tenantCode())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found."));

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid credentials."));

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ForbiddenOperationException("Invalid credentials.");
        }

        UserTenant userTenant = userTenantRepository.findByTenantIdAndUserIdAndActiveTrue(tenant.getId(), user.getId())
                .orElseThrow(() -> new ForbiddenOperationException("User has no active access to tenant."));

        TenantAuthorizationResolver.ResolvedTenantAuthorization resolved = tenantAuthorizationResolver.resolve(userTenant);
        AuthenticatedUser principal = new AuthenticatedUser(
                user.getId(),
                tenant.getId(),
                user.getEmail(),
                resolved.primaryRole(),
                resolved.roles(),
                resolved.permissions()
        );

        AuthTokenResponse response = createTokenResponse(principal, user.getFullName());

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
    public AuthTokenResponse refresh(RefreshRequest request) {
        String tokenHash = refreshTokenHashService.hash(request.refreshToken());

        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
                .orElseThrow(() -> new ForbiddenOperationException("Refresh token is invalid."));

        if (storedToken.isExpired()) {
            storedToken.setRevokedAt(Instant.now());
            refreshTokenRepository.save(storedToken);
            throw new ForbiddenOperationException("Refresh token expired.");
        }

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

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

        AuthTokenResponse response = createTokenResponse(principal, user.getFullName());

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
    public void logout(LogoutRequest request) {
        String tokenHash = refreshTokenHashService.hash(request.refreshToken());

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

    @Transactional(readOnly = true)
    public AuthenticatedUserResponse me() {
        AuthenticatedUser authenticatedUser = currentUserService.getRequiredUser();
        User user = userRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        return AuthMapper.toAuthenticatedUserResponse(user, authenticatedUser);
    }

    private AuthTokenResponse createTokenResponse(AuthenticatedUser principal, String fullName) {
        revokeActiveRefreshTokens(principal.tenantId(), principal.userId());

        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();

        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setTenantId(principal.tenantId());
        refreshTokenEntity.setUserId(principal.userId());
        refreshTokenEntity.setTokenHash(refreshTokenHashService.hash(refreshToken));
        refreshTokenEntity.setExpiresAt(jwtService.getRefreshExpiration());
        refreshTokenRepository.save(refreshTokenEntity);

        AuthenticatedUserResponse userResponse = AuthMapper.toAuthenticatedUserResponse(principal, fullName);

        return new AuthTokenResponse(
                accessToken,
                refreshToken,
                jwtProperties.getAccessMinutes() * 60,
                userResponse
        );
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
}
