package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.core.auth.domain.RefreshToken;
import com.phaiffertech.platform.core.auth.repository.RefreshTokenRepository;
import com.phaiffertech.platform.core.auth.dto.AuthTokenResponse;
import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.LoginRequest;
import com.phaiffertech.platform.core.auth.dto.RefreshRequest;
import com.phaiffertech.platform.core.auth.mapper.AuthMapper;
import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
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
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CurrentUserService currentUserService;

    public AuthService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenRepository refreshTokenRepository,
            CurrentUserService currentUserService
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenRepository = refreshTokenRepository;
        this.currentUserService = currentUserService;
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

        Role role = roleRepository.findById(userTenant.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role mapping not found."));

        AuthenticatedUser principal = new AuthenticatedUser(user.getId(), tenant.getId(), user.getEmail(), role.getCode());

        return createTokenResponse(principal, user.getFullName());
    }

    @Transactional
    public AuthTokenResponse refresh(RefreshRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByTokenAndRevokedAtIsNull(request.refreshToken())
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

        Role role = roleRepository.findById(userTenant.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role mapping not found."));

        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        AuthenticatedUser principal = new AuthenticatedUser(user.getId(), storedToken.getTenantId(), user.getEmail(), role.getCode());
        return createTokenResponse(principal, user.getFullName());
    }

    @Transactional(readOnly = true)
    public AuthenticatedUserResponse me() {
        AuthenticatedUser authenticatedUser = currentUserService.getRequiredUser();
        User user = userRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        return AuthMapper.toAuthenticatedUserResponse(user, authenticatedUser);
    }

    private AuthTokenResponse createTokenResponse(AuthenticatedUser principal, String fullName) {
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = UUID.randomUUID().toString();

        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setTenantId(principal.tenantId());
        refreshTokenEntity.setUserId(principal.userId());
        refreshTokenEntity.setToken(refreshToken);
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
}
