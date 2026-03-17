package com.phaiffertech.platform.core.audit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import com.phaiffertech.platform.shared.usage.UsageTelemetryService;
import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditableActionAspect {

    private static final String[] SENSITIVE_KEYS = {"password", "token", "secret"};

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final UsageTelemetryService usageTelemetryService;

    public AuditableActionAspect(
            AuditLogService auditLogService,
            ObjectMapper objectMapper,
            UsageTelemetryService usageTelemetryService
    ) {
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
        this.usageTelemetryService = usageTelemetryService;
    }

    @Around("@annotation(auditableAction)")
    public Object audit(ProceedingJoinPoint joinPoint, AuditableAction auditableAction) throws Throwable {
        Object result = joinPoint.proceed();
        String entityId = resolveEntityId(result, joinPoint.getArgs());
        UUID tenantId = resolveTenantId(auditableAction.entity(), result, joinPoint.getArgs(), entityId);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("method", joinPoint.getSignature().toShortString());
        payload.put("arguments", sanitize(joinPoint.getArgs()));

        auditLogService.logCurrentUserEvent(
                tenantId,
                auditableAction.action().name(),
                auditableAction.entity(),
                entityId,
                payload
        );

        if (AuditActionType.CREATE.equals(auditableAction.action()) && tenantId != null) {
            usageTelemetryService.recordEntityCreated(tenantId, auditableAction.entity());
        }

        return result;
    }

    private Object sanitize(Object value) {
        JsonNode node = objectMapper.valueToTree(value);
        sanitizeNode(node);
        return objectMapper.convertValue(node, Object.class);
    }

    private void sanitizeNode(JsonNode node) {
        if (node == null) {
            return;
        }

        if (node instanceof ObjectNode objectNode) {
            objectNode.fields().forEachRemaining(entry -> {
                if (isSensitive(entry.getKey())) {
                    objectNode.put(entry.getKey(), "***");
                } else {
                    sanitizeNode(entry.getValue());
                }
            });
            return;
        }

        if (node instanceof ArrayNode arrayNode) {
            arrayNode.forEach(this::sanitizeNode);
        }
    }

    private boolean isSensitive(String key) {
        String normalized = key.toLowerCase();
        for (String sensitiveKey : SENSITIVE_KEYS) {
            if (normalized.contains(sensitiveKey)) {
                return true;
            }
        }
        return false;
    }

    private String resolveEntityId(Object result, Object[] args) {
        String resultId = extractId(result);
        if (resultId != null) {
            return resultId;
        }

        for (Object arg : args) {
            String argId = extractId(arg);
            if (argId != null) {
                return argId;
            }
        }

        return null;
    }

    private UUID resolveTenantId(String entity, Object result, Object[] args, String entityId) {
        UUID tenantId = extractTenantId(result);
        if (tenantId != null) {
            return tenantId;
        }

        for (Object arg : args) {
            tenantId = extractTenantId(arg);
            if (tenantId != null) {
                return tenantId;
            }
        }

        if ("tenant".equals(entity) && entityId != null) {
            try {
                return UUID.fromString(entityId);
            } catch (IllegalArgumentException ignored) {
            }
        }

        return TenantContext.getTenantId();
    }

    private String extractId(Object source) {
        if (source == null) {
            return null;
        }

        if (source instanceof UUID uuid) {
            return uuid.toString();
        }

        try {
            Method method = source.getClass().getMethod("id");
            Object value = method.invoke(source);
            return value == null ? null : value.toString();
        } catch (Exception ignored) {
        }

        try {
            Method method = source.getClass().getMethod("getId");
            Object value = method.invoke(source);
            return value == null ? null : value.toString();
        } catch (Exception ignored) {
            return null;
        }
    }

    private UUID extractTenantId(Object source) {
        if (source == null) {
            return null;
        }

        try {
            Method method = source.getClass().getMethod("tenantId");
            Object value = method.invoke(source);
            return value instanceof UUID uuid ? uuid : parseUuid(value);
        } catch (Exception ignored) {
        }

        try {
            Method method = source.getClass().getMethod("getTenantId");
            Object value = method.invoke(source);
            return value instanceof UUID uuid ? uuid : parseUuid(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private UUID parseUuid(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
