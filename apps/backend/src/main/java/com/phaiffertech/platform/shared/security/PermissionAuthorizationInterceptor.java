package com.phaiffertech.platform.shared.security;

import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class PermissionAuthorizationInterceptor implements HandlerInterceptor {

    private final CurrentUserService currentUserService;
    private final PermissionAuthorizationService permissionAuthorizationService;
    private final TenantEntitlementService tenantEntitlementService;

    public PermissionAuthorizationInterceptor(
            CurrentUserService currentUserService,
            PermissionAuthorizationService permissionAuthorizationService,
            TenantEntitlementService tenantEntitlementService
    ) {
        this.currentUserService = currentUserService;
        this.permissionAuthorizationService = permissionAuthorizationService;
        this.tenantEntitlementService = tenantEntitlementService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermission methodPermission = AnnotationUtils.findAnnotation(
                handlerMethod.getMethod(),
                RequirePermission.class
        );
        RequirePermission classPermission = AnnotationUtils.findAnnotation(
                handlerMethod.getBeanType(),
                RequirePermission.class
        );

        if (methodPermission == null && classPermission == null) {
            return true;
        }

        String requiredPermission = firstNonBlank(
                methodPermission != null ? methodPermission.value() : null,
                classPermission != null ? classPermission.value() : null
        );

        AuthenticatedUser user = currentUserService.getRequiredUser();
        if (requiredPermission != null && !permissionAuthorizationService.hasPermission(user, requiredPermission)) {
            throw new ForbiddenOperationException("Missing permission: " + requiredPermission);
        }

        UUID tenantId = TenantContext.getTenantId();
        String requiredEntitlement = firstNonBlank(
                methodPermission != null ? methodPermission.entitlement() : null,
                classPermission != null ? classPermission.entitlement() : null
        );
        if (tenantId != null
                && requiredEntitlement != null
                && !tenantEntitlementService.hasEntitlement(tenantId, requiredEntitlement)) {
            throw new ForbiddenOperationException("Missing tenant entitlement: " + requiredEntitlement);
        }

        String[] anyRequiredEntitlements = firstConfiguredEntitlements(
                methodPermission != null ? methodPermission.anyEntitlements() : null,
                classPermission != null ? classPermission.anyEntitlements() : null
        );
        if (tenantId != null
                && anyRequiredEntitlements.length > 0
                && Arrays.stream(anyRequiredEntitlements)
                .filter(entitlement -> entitlement != null && !entitlement.isBlank())
                .noneMatch(entitlement -> tenantEntitlementService.hasEntitlement(tenantId, entitlement))) {
            throw new ForbiddenOperationException(
                    "Missing tenant entitlement from set: " + String.join(", ", anyRequiredEntitlements)
            );
        }

        return true;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return null;
    }

    private String[] firstConfiguredEntitlements(String[] primary, String[] fallback) {
        if (primary != null && Arrays.stream(primary).anyMatch(entitlement -> entitlement != null && !entitlement.isBlank())) {
            return primary;
        }
        if (fallback != null && Arrays.stream(fallback).anyMatch(entitlement -> entitlement != null && !entitlement.isBlank())) {
            return fallback;
        }
        return new String[0];
    }
}
