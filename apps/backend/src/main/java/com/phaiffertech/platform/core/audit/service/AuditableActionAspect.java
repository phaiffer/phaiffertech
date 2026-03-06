package com.phaiffertech.platform.core.audit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditableActionAspect {

    private static final String[] SENSITIVE_KEYS = {"password", "token", "secret"};

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public AuditableActionAspect(AuditLogService auditLogService, ObjectMapper objectMapper) {
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Around("@annotation(auditableAction)")
    public Object audit(ProceedingJoinPoint joinPoint, AuditableAction auditableAction) throws Throwable {
        Object result = joinPoint.proceed();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("method", joinPoint.getSignature().toShortString());
        payload.put("arguments", sanitize(joinPoint.getArgs()));

        auditLogService.logCurrentContext(
                auditableAction.action().name(),
                auditableAction.entity(),
                resolveEntityId(result, joinPoint.getArgs()),
                payload
        );

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
}
