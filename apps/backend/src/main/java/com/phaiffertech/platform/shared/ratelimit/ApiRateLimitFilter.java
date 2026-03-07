package com.phaiffertech.platform.shared.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.shared.response.ApiErrorResponse;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private enum RatePolicy {
        AUTH, API, TELEMETRY
    }

    private final RateLimitProperties rateLimitProperties;
    private final ObjectMapper objectMapper;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public ApiRateLimitFilter(RateLimitProperties rateLimitProperties, ObjectMapper objectMapper) {
        this.rateLimitProperties = rateLimitProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!rateLimitProperties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        RatePolicy policy = resolvePolicy(request);
        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = policy.name() + ":" + resolveIdentity(request);
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> createBucket(policy));
        if (!bucket.tryConsume(1)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiErrorResponse.of("RATE_LIMIT_EXCEEDED", "Too many requests. Please retry later.")
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RatePolicy resolvePolicy(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/health") || path.startsWith("/actuator/health")) {
            return null;
        }
        if (path.startsWith("/api/v1/auth")) {
            return RatePolicy.AUTH;
        }
        if ("POST".equalsIgnoreCase(request.getMethod()) && path.startsWith("/api/v1/iot/telemetry")) {
            return RatePolicy.TELEMETRY;
        }
        if (path.startsWith("/api/v1/")) {
            return RatePolicy.API;
        }
        return null;
    }

    private Bucket createBucket(RatePolicy policy) {
        int capacity = switch (policy) {
            case AUTH -> rateLimitProperties.getAuthPerMinute();
            case TELEMETRY -> rateLimitProperties.getTelemetryPerMinute();
            case API -> rateLimitProperties.getApiPerMinute();
        };

        Bandwidth limit = Bandwidth.classic(
                capacity,
                Refill.intervally(capacity, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveIdentity(HttpServletRequest request) {
        String ip = request.getRemoteAddr() == null ? "unknown-ip" : request.getRemoteAddr();
        UUID tenantId = TenantContext.getTenantId();
        String tenant = tenantId == null ? "no-tenant" : tenantId.toString();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return tenant + ":" + user.userId();
        }
        return tenant + ":" + ip;
    }
}
