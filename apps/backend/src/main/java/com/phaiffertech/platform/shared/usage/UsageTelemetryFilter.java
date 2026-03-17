package com.phaiffertech.platform.shared.usage;

import com.phaiffertech.platform.shared.tenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class UsageTelemetryFilter extends OncePerRequestFilter {

    private final UsageTelemetryService usageTelemetryService;

    public UsageTelemetryFilter(UsageTelemetryService usageTelemetryService) {
        this.usageTelemetryService = usageTelemetryService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestPath = request.getRequestURI();
        return requestPath == null || !requestPath.startsWith("/api/v1/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        filterChain.doFilter(request, response);
        usageTelemetryService.recordApiRequest(TenantContext.getTenantId(), request.getRequestURI(), response.getStatus());
    }
}
