package com.phaiffertech.platform.shared.security;

import com.phaiffertech.platform.shared.config.CorsProperties;
import com.phaiffertech.platform.shared.logging.RequestLoggingFilter;
import com.phaiffertech.platform.shared.logging.TenantLoggingFilter;
import com.phaiffertech.platform.shared.ratelimit.ApiRateLimitFilter;
import com.phaiffertech.platform.shared.ratelimit.RateLimitProperties;
import com.phaiffertech.platform.shared.tenancy.TenantContextFilter;
import com.phaiffertech.platform.shared.tenancy.TenantProperties;
import com.phaiffertech.platform.shared.usage.UsageTelemetryFilter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties({
        CorsProperties.class,
        JwtProperties.class,
        TenantProperties.class,
        RateLimitProperties.class,
        BruteForceProtectionProperties.class,
        PublicEndpointProperties.class
})
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final TenantContextFilter tenantContextFilter;
    private final ModuleAccessGuard moduleAccessGuard;
    private final ApiRateLimitFilter apiRateLimitFilter;
    private final TenantLoggingFilter tenantLoggingFilter;
    private final RequestLoggingFilter requestLoggingFilter;
    private final UsageTelemetryFilter usageTelemetryFilter;
    private final CorsProperties corsProperties;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final PublicEndpointProperties publicEndpointProperties;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            TenantContextFilter tenantContextFilter,
            ModuleAccessGuard moduleAccessGuard,
            ApiRateLimitFilter apiRateLimitFilter,
            TenantLoggingFilter tenantLoggingFilter,
            RequestLoggingFilter requestLoggingFilter,
            UsageTelemetryFilter usageTelemetryFilter,
            CorsProperties corsProperties,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler,
            PublicEndpointProperties publicEndpointProperties
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.tenantContextFilter = tenantContextFilter;
        this.moduleAccessGuard = moduleAccessGuard;
        this.apiRateLimitFilter = apiRateLimitFilter;
        this.tenantLoggingFilter = tenantLoggingFilter;
        this.requestLoggingFilter = requestLoggingFilter;
        this.usageTelemetryFilter = usageTelemetryFilter;
        this.corsProperties = corsProperties;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
        this.publicEndpointProperties = publicEndpointProperties;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        List<String> publicPaths = buildPublicPaths();

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> {
                    headers.frameOptions(frame -> frame.deny());
                    headers.contentTypeOptions(Customizer.withDefaults());
                    headers.referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER));
                    headers.permissionsPolicy(policy -> policy.policy("camera=(), geolocation=(), microphone=()"));
                    headers.httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31536000));
                    headers.contentSecurityPolicy(csp -> csp
                            .policyDirectives("default-src 'self'; frame-ancestors 'none'; object-src 'none'"));
                })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(publicPaths.toArray(String[]::new)).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(tenantContextFilter, JwtAuthenticationFilter.class)
                .addFilterAfter(moduleAccessGuard, TenantContextFilter.class)
                .addFilterAfter(apiRateLimitFilter, ModuleAccessGuard.class)
                .addFilterAfter(tenantLoggingFilter, TenantContextFilter.class)
                .addFilterAfter(requestLoggingFilter, TenantLoggingFilter.class)
                .addFilterAfter(usageTelemetryFilter, RequestLoggingFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(corsProperties.getAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant-Id", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> buildPublicPaths() {
        List<String> publicPaths = new ArrayList<>(List.of(
                "/api/v1/auth/login",
                "/api/v1/auth/demo-login",
                "/api/v1/auth/refresh",
                "/api/v1/auth/request-password-reset",
                "/api/v1/auth/confirm-password-reset",
                "/api/v1/health",
                "/actuator/health",
                "/actuator/health/**"
        ));

        if (publicEndpointProperties.isObservabilityEnabled()) {
            publicPaths.add("/actuator/metrics/**");
            publicPaths.add("/actuator/prometheus");
        }

        if (publicEndpointProperties.isDocsEnabled()) {
            publicPaths.add("/v3/api-docs/**");
            publicPaths.add("/swagger-ui/**");
            publicPaths.add("/swagger-ui.html");
        }

        return publicPaths;
    }
}
