package com.phaiffertech.platform.core.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.audit.domain.AuditLog;
import com.phaiffertech.platform.core.audit.repository.AuditLogRepository;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import com.phaiffertech.platform.shared.web.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final PlatformMetricsService platformMetricsService;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            ObjectMapper objectMapper,
            PlatformMetricsService platformMetricsService
    ) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.platformMetricsService = platformMetricsService;
    }

    @Transactional
    public void logCurrentContext(String action, String entity, String entityId, Object payload) {
        UUID tenantId = TenantContext.getTenantId();
        logCurrentUserEvent(tenantId, action, entity, entityId, payload);
    }

    @Transactional
    public void logCurrentUserEvent(UUID tenantId, String action, String entity, String entityId, Object payload) {
        logEvent(tenantId, resolveCurrentUserId(), action, entity, entityId, payload);
    }

    @Transactional
    public void logEvent(UUID tenantId, UUID userId, String action, String entity, String entityId, Object payload) {
        if (tenantId == null) {
            return;
        }

        AuditRequestDetails requestDetails = resolveRequestDetails();
        AuditLog auditLog = new AuditLog();
        auditLog.setTenantId(tenantId);
        auditLog.setUserId(userId);
        auditLog.setAction(action);
        auditLog.setEntity(entity);
        auditLog.setEntityId(entityId);
        auditLog.setPayload(toJson(enrichPayload(payload, requestDetails)));
        auditLog.setIpAddress(requestDetails.ipAddress());

        auditLogRepository.save(auditLog);
        platformMetricsService.recordAuditEvent(action, entity);
    }

    private UUID resolveCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            return null;
        }

        return user.userId();
    }

    private String toJson(Object payload) {
        if (payload == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return "{\"serializationError\":true}";
        }
    }

    private Object enrichPayload(Object payload, AuditRequestDetails requestDetails) {
        if (requestDetails.isEmpty()) {
            return payload;
        }

        Map<String, Object> enrichedPayload = new LinkedHashMap<>();
        if (payload instanceof Map<?, ?> mapPayload) {
            mapPayload.forEach((key, value) -> enrichedPayload.put(String.valueOf(key), value));
        } else if (payload != null) {
            enrichedPayload.put("payload", payload);
        }

        Map<String, Object> auditContext = new LinkedHashMap<>();
        if (requestDetails.method() != null) {
            auditContext.put("method", requestDetails.method());
        }
        if (requestDetails.path() != null) {
            auditContext.put("path", requestDetails.path());
        }
        if (requestDetails.ipAddress() != null) {
            auditContext.put("ipAddress", requestDetails.ipAddress());
        }

        if (!auditContext.isEmpty()) {
            enrichedPayload.put("auditContext", auditContext);
        }

        return enrichedPayload.isEmpty() ? null : enrichedPayload;
    }

    private AuditRequestDetails resolveRequestDetails() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return AuditRequestDetails.empty();
        }

        HttpServletRequest request = attributes.getRequest();
        return new AuditRequestDetails(
                request.getMethod(),
                request.getRequestURI(),
                ClientIpResolver.resolve(request)
        );
    }

    private record AuditRequestDetails(String method, String path, String ipAddress) {

        private static AuditRequestDetails empty() {
            return new AuditRequestDetails(null, null, null);
        }

        private boolean isEmpty() {
            return method == null && path == null && ipAddress == null;
        }
    }
}
