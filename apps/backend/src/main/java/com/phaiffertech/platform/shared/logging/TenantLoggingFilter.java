package com.phaiffertech.platform.shared.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TenantLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            MDC.put(LoggingUtils.TENANT_ID, LoggingUtils.resolveTenantId());
            MDC.put(LoggingUtils.USER_ID, LoggingUtils.resolveUserId());
            LoggingUtils.populateTraceIdentifiers();
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(LoggingUtils.TENANT_ID);
            MDC.remove(LoggingUtils.USER_ID);
            MDC.remove(LoggingUtils.TRACE_ID);
            MDC.remove(LoggingUtils.SPAN_ID);
        }
    }
}
