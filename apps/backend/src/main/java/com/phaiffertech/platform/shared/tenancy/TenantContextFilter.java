package com.phaiffertech.platform.shared.tenancy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.shared.response.ApiErrorResponse;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TenantContextFilter extends OncePerRequestFilter {

    private final TenantProperties tenantProperties;
    private final ObjectMapper objectMapper;

    public TenantContextFilter(TenantProperties tenantProperties, ObjectMapper objectMapper) {
        this.tenantProperties = tenantProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String tenantHeader = request.getHeader(tenantProperties.getHeaderName());

            if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
                if (tenantHeader != null && !tenantHeader.isBlank()) {
                    UUID requestedTenantId = parseTenantHeader(tenantHeader, response);
                    if (requestedTenantId == null) {
                        return;
                    }
                    if (!user.tenantId().equals(requestedTenantId)) {
                        writeForbiddenResponse(response);
                        return;
                    }
                }
                TenantContext.setTenantId(user.tenantId());
            } else if (tenantHeader != null && !tenantHeader.isBlank()) {
                UUID requestedTenantId = parseTenantHeader(tenantHeader, response);
                if (requestedTenantId == null) {
                    return;
                }
                TenantContext.setTenantId(requestedTenantId);
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void writeForbiddenResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiErrorResponse payload = ApiErrorResponse.of("FORBIDDEN", "Tenant mismatch in request context.");
        response.getWriter().write(objectMapper.writeValueAsString(payload));
    }

    private UUID parseTenantHeader(String tenantHeader, HttpServletResponse response) throws IOException {
        try {
            return UUID.fromString(tenantHeader);
        } catch (IllegalArgumentException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiErrorResponse payload = ApiErrorResponse.of("BAD_REQUEST", "Invalid tenant header format.");
            response.getWriter().write(objectMapper.writeValueAsString(payload));
            return null;
        }
    }
}
