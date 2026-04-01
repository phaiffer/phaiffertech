package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.core.auth.domain.SupportImpersonationSession;
import com.phaiffertech.platform.core.auth.domain.SupportImpersonationStatus;
import com.phaiffertech.platform.core.auth.dto.AuthTokenResponse;
import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.SupportImpersonationContextResponse;
import com.phaiffertech.platform.core.auth.dto.SupportImpersonationStartRequest;
import com.phaiffertech.platform.core.auth.mapper.AuthMapper;
import com.phaiffertech.platform.core.auth.repository.SupportImpersonationSessionRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.iam.service.TenantAuthorizationResolver;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.tenant.service.PlatformAccessService;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.security.JwtService;
import com.phaiffertech.platform.shared.security.SupportImpersonationDetails;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportImpersonationService {

    private static final int DEFAULT_DURATION_MINUTES = 15;

    private final CurrentUserService currentUserService;
    private final PlatformAccessService platformAccessService;
    private final SupportImpersonationSessionRepository sessionRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final TenantAuthorizationResolver tenantAuthorizationResolver;
    private final AuditLogService auditLogService;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final TenantEntitlementService tenantEntitlementService;

    public SupportImpersonationService(
            CurrentUserService currentUserService,
            PlatformAccessService platformAccessService,
            SupportImpersonationSessionRepository sessionRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            TenantAuthorizationResolver tenantAuthorizationResolver,
            AuditLogService auditLogService,
            JwtService jwtService,
            JwtProperties jwtProperties,
            TenantEntitlementService tenantEntitlementService
    ) {
        this.currentUserService = currentUserService;
        this.platformAccessService = platformAccessService;
        this.sessionRepository = sessionRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.tenantAuthorizationResolver = tenantAuthorizationResolver;
        this.auditLogService = auditLogService;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.tenantEntitlementService = tenantEntitlementService;
    }

    @Transactional
    public AuthTokenResponse start(SupportImpersonationStartRequest request) {
        platformAccessService.assertPlatformAdministrationAccess();

        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        Instant now = normalizeInstant(Instant.now());
        expireStaleActiveSession(currentUser.userId(), now);

        sessionRepository.findFirstByPlatformAdminUserIdAndStatusAndEndedAtIsNullOrderByStartedAtDesc(
                currentUser.userId(),
                SupportImpersonationStatus.ACTIVE
        ).ifPresent(session -> {
            throw new ConflictOperationException("An active support impersonation session already exists.");
        });

        Tenant sourceTenant = tenantRepository.findById(currentUser.tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated tenant not found."));
        Tenant targetTenant = tenantRepository.findById(request.targetTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Target tenant not found."));

        if (sourceTenant.getId().equals(targetTenant.getId())) {
            throw new ForbiddenOperationException("Support impersonation requires a different target tenant.");
        }

        if (targetTenant.isPlatformOwner()) {
            throw new ForbiddenOperationException("Support impersonation is restricted to customer tenants.");
        }

        User user = userRepository.findById(currentUser.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        Instant startedAt = now;
        Instant expiresAt = startedAt.plus(resolveDurationMinutes(request), ChronoUnit.MINUTES);

        SupportImpersonationSession session = new SupportImpersonationSession();
        session.setPlatformAdminUserId(currentUser.userId());
        session.setPlatformAdminTenantId(sourceTenant.getId());
        session.setTargetTenantId(targetTenant.getId());
        session.setReason(request.reason().trim());
        session.setStartedAt(startedAt);
        session.setExpiresAt(expiresAt);
        session.setStatus(SupportImpersonationStatus.ACTIVE);
        session = sessionRepository.save(session);

        SupportImpersonationDetails impersonation = new SupportImpersonationDetails(
                session.getId(),
                sourceTenant.getId(),
                currentUser.userId(),
                startedAt,
                expiresAt
        );
        AuthenticatedUser impersonatedPrincipal = new AuthenticatedUser(
                currentUser.userId(),
                targetTenant.getId(),
                currentUser.email(),
                currentUser.role(),
                currentUser.roles(),
                currentUser.permissions(),
                impersonation
        );

        logLifecycleEvent("START", session, sourceTenant, targetTenant);

        return issueAccessTokenResponse(impersonatedPrincipal, user, targetTenant, expiresAt, sourceTenant);
    }

    @Transactional
    public AuthTokenResponse stop() {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        SupportImpersonationSession session = requireActiveSession(currentUser);

        Instant endedAt = normalizeInstant(Instant.now());
        session.setEndedAt(endedAt);
        session.setStatus(SupportImpersonationStatus.ENDED);
        sessionRepository.save(session);

        Tenant sourceTenant = tenantRepository.findById(session.getPlatformAdminTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Impersonation source tenant not found."));
        Tenant targetTenant = tenantRepository.findById(session.getTargetTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Impersonation target tenant not found."));
        User user = userRepository.findById(session.getPlatformAdminUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        UserTenant userTenant = userTenantRepository.findByTenantIdAndUserIdAndActiveTrue(
                        sourceTenant.getId(),
                        session.getPlatformAdminUserId())
                .orElseThrow(() -> new ForbiddenOperationException("Platform administrator access was revoked."));

        TenantAuthorizationResolver.ResolvedTenantAuthorization resolved = tenantAuthorizationResolver.resolve(userTenant);
        AuthenticatedUser restoredPrincipal = new AuthenticatedUser(
                user.getId(),
                sourceTenant.getId(),
                user.getEmail(),
                resolved.primaryRole(),
                resolved.roles(),
                resolved.permissions()
        );

        logLifecycleEvent("STOP", session, sourceTenant, targetTenant);

        return issueAccessTokenResponse(restoredPrincipal, user, sourceTenant, null, null);
    }

    @Transactional
    public void assertActiveSession(AuthenticatedUser user) {
        if (user == null || !user.isImpersonating()) {
            return;
        }

        SupportImpersonationSession session = sessionRepository.findByIdAndPlatformAdminUserId(
                        user.impersonation().sessionId(),
                        user.userId())
                .orElseThrow(() -> new ForbiddenOperationException("Support impersonation session is invalid."));

        if (!session.getPlatformAdminTenantId().equals(user.impersonation().sourceTenantId())
                || !session.getTargetTenantId().equals(user.tenantId())
                || session.getStatus() != SupportImpersonationStatus.ACTIVE
                || session.getEndedAt() != null) {
            throw new ForbiddenOperationException("Support impersonation session is no longer active.");
        }

        Instant now = normalizeInstant(Instant.now());
        if (!session.getExpiresAt().isAfter(now)
                || !normalizeInstant(user.impersonation().expiresAt()).equals(normalizeInstant(session.getExpiresAt()))) {
            expireSession(session, now);
            throw new ForbiddenOperationException("Support impersonation session expired.");
        }
    }

    private SupportImpersonationSession requireActiveSession(AuthenticatedUser user) {
        if (user == null || !user.isImpersonating()) {
            throw new ForbiddenOperationException("No active support impersonation session found.");
        }

        assertActiveSession(user);

        return sessionRepository.findByIdAndPlatformAdminUserId(user.impersonation().sessionId(), user.userId())
                .orElseThrow(() -> new ForbiddenOperationException("Support impersonation session is invalid."));
    }

    private int resolveDurationMinutes(SupportImpersonationStartRequest request) {
        return request.durationMinutes() == null ? DEFAULT_DURATION_MINUTES : request.durationMinutes();
    }

    private void expireStaleActiveSession(UUID platformAdminUserId, Instant now) {
        sessionRepository.findFirstByPlatformAdminUserIdAndStatusAndEndedAtIsNullOrderByStartedAtDesc(
                platformAdminUserId,
                SupportImpersonationStatus.ACTIVE
        ).ifPresent(session -> {
            if (!session.getExpiresAt().isAfter(now)) {
                expireSession(session, now);
            }
        });
    }

    private void expireSession(SupportImpersonationSession session, Instant endedAt) {
        session.setEndedAt(normalizeInstant(endedAt));
        session.setStatus(SupportImpersonationStatus.EXPIRED);
        sessionRepository.save(session);
    }

    private AuthTokenResponse issueAccessTokenResponse(
            AuthenticatedUser principal,
            User user,
            Tenant tenant,
            Instant customExpiry,
            Tenant sourceTenant
    ) {
        Instant expiresAt = customExpiry == null
                ? normalizeInstant(Instant.now()).plus(jwtProperties.getAccessMinutes(), ChronoUnit.MINUTES)
                : normalizeInstant(customExpiry);

        String accessToken = jwtService.generateAccessToken(principal, expiresAt);
        SupportImpersonationContextResponse impersonation = sourceTenant == null
                ? null
                : AuthMapper.toSupportImpersonationContextResponse(principal.impersonation(), sourceTenant);
        AuthenticatedUserResponse userResponse = AuthMapper.toAuthenticatedUserResponse(
                user,
                principal,
                tenant,
                tenantEntitlementService.resolveEffectiveEntitlements(tenant.getId()),
                impersonation
        );

        return new AuthTokenResponse(
                accessToken,
                Math.max(1, expiresAt.getEpochSecond() - Instant.now().getEpochSecond()),
                userResponse
        );
    }

    private Instant normalizeInstant(Instant instant) {
        return instant.truncatedTo(ChronoUnit.MILLIS);
    }

    private void logLifecycleEvent(
            String action,
            SupportImpersonationSession session,
            Tenant sourceTenant,
            Tenant targetTenant
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("platformAdminUserId", session.getPlatformAdminUserId());
        payload.put("sourceTenantId", sourceTenant.getId());
        payload.put("sourceTenantCode", sourceTenant.getCode());
        payload.put("targetTenantId", targetTenant.getId());
        payload.put("targetTenantCode", targetTenant.getCode());
        payload.put("reason", session.getReason());
        payload.put("startedAt", session.getStartedAt());
        payload.put("expiresAt", session.getExpiresAt());
        payload.put("endedAt", session.getEndedAt());
        payload.put("status", session.getStatus().name());

        String sessionId = session.getId().toString();
        auditLogService.logEvent(
                sourceTenant.getId(),
                session.getPlatformAdminUserId(),
                action,
                "support_impersonation_session",
                sessionId,
                payload
        );
        auditLogService.logEvent(
                targetTenant.getId(),
                session.getPlatformAdminUserId(),
                action,
                "support_impersonation_session",
                sessionId,
                payload
        );
    }
}
