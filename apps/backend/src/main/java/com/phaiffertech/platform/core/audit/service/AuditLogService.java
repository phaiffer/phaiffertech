package com.phaiffertech.platform.core.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.audit.domain.AuditLog;
import com.phaiffertech.platform.core.audit.repository.AuditLogRepository;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCurrentContext(String action, String entity, String entityId, Object payload) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = resolveCurrentUserId();
        logEvent(tenantId, userId, action, entity, entityId, payload);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(UUID tenantId, UUID userId, String action, String entity, String entityId, Object payload) {
        if (tenantId == null) {
            return;
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setTenantId(tenantId);
        auditLog.setUserId(userId);
        auditLog.setAction(action);
        auditLog.setEntity(entity);
        auditLog.setEntityId(entityId);
        auditLog.setPayload(toJson(payload));

        auditLogRepository.save(auditLog);
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
}
