package com.phaiffertech.platform.shared.security;

import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

        RequirePermission permission = AnnotationUtils.findAnnotation(handlerMethod.getMethod(), RequirePermission.class);
        if (permission == null) {
            permission = AnnotationUtils.findAnnotation(handlerMethod.getBeanType(), RequirePermission.class);
        }

        if (permission == null) {
            return true;
        }

        AuthenticatedUser user = currentUserService.getRequiredUser();
        if (!permissionAuthorizationService.hasPermission(user, permission.value())) {
            throw new ForbiddenOperationException("Missing permission: " + permission.value());
        }

        String requiredEntitlement = permission.entitlement();
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null
                && requiredEntitlement != null
                && !requiredEntitlement.isBlank()
                && !tenantEntitlementService.hasEntitlement(tenantId, requiredEntitlement)) {
            throw new ForbiddenOperationException("Missing tenant entitlement: " + requiredEntitlement);
        }

        return true;
    }
}
