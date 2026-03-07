package com.phaiffertech.platform.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.module.service.ModuleAccessService;
import com.phaiffertech.platform.shared.response.ApiErrorResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ModuleAccessGuard extends OncePerRequestFilter {

    private final ModuleAccessService moduleAccessService;
    private final ObjectMapper objectMapper;

    public ModuleAccessGuard(ModuleAccessService moduleAccessService, ObjectMapper objectMapper) {
        this.moduleAccessService = moduleAccessService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestPath = request.getRequestURI();
        if (moduleAccessService.resolveModuleCode(requestPath).isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!moduleAccessService.isPathEnabled(tenantId, requestPath)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiErrorResponse.of("MODULE_DISABLED", "Module is disabled for the current tenant.")
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
