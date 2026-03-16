package com.phaiffertech.platform.shared.security;

import com.phaiffertech.platform.core.auth.config.DemoAccessProperties;
import com.phaiffertech.platform.infrastructure.bootstrap.MasterAdminBootstrapProperties;
import com.phaiffertech.platform.shared.config.CorsProperties;
import io.jsonwebtoken.io.Decoders;
import java.util.Arrays;
import java.util.List;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ProductionConfigurationValidator {

    static final String LOCAL_DEVELOPMENT_JWT_SECRET = "ZmFrZV9qd3Rfc2VjcmV0X2Zvcl9kZXZlbG9wbWVudF9vbmx5XzEyMzQ1";
    private static final int MINIMUM_SECRET_BYTES = 32;

    private final Environment environment;
    private final JwtProperties jwtProperties;
    private final CorsProperties corsProperties;
    private final DemoAccessProperties demoAccessProperties;
    private final MasterAdminBootstrapProperties masterAdminBootstrapProperties;

    public ProductionConfigurationValidator(
            Environment environment,
            JwtProperties jwtProperties,
            CorsProperties corsProperties,
            DemoAccessProperties demoAccessProperties,
            MasterAdminBootstrapProperties masterAdminBootstrapProperties
    ) {
        this.environment = environment;
        this.jwtProperties = jwtProperties;
        this.corsProperties = corsProperties;
        this.demoAccessProperties = demoAccessProperties;
        this.masterAdminBootstrapProperties = masterAdminBootstrapProperties;
    }

    @jakarta.annotation.PostConstruct
    void validate() {
        boolean productionProfileActive = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile));

        if (productionProfileActive) {
            requireNonBlank("spring.datasource.url", environment.getProperty("spring.datasource.url"));
            requireNonBlank("spring.datasource.username", environment.getProperty("spring.datasource.username"));
            requireNonBlank("spring.datasource.password", environment.getProperty("spring.datasource.password"));
            requireNonBlank("app.security.jwt.secret", jwtProperties.getSecret());

            validateJwtSecret();
            validateRefreshCookiePolicy();
            validateCorsOrigins();
        }

        if (masterAdminBootstrapProperties.isEnabled() && !masterAdminBootstrapProperties.hasRequiredCredentials()) {
            throw new IllegalStateException(
                    "Master admin bootstrap requires tenant code, tenant name, user email and user password."
            );
        }

        if (demoAccessProperties.isEnabled()) {
            if (!demoAccessProperties.hasCredentialsConfigured()) {
                throw new IllegalStateException(
                        "Demo assisted access requires tenant code, user email and user password when enabled."
                );
            }

            if (productionProfileActive && !demoAccessProperties.isEnforceFeatureFlag()) {
                throw new IllegalStateException(
                        "Production demo assisted access requires app.demo.assisted.enforce-feature-flag=true."
                );
            }
        }
    }

    private void requireNonBlank(String propertyName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required production property: " + propertyName);
        }
    }

    private void validateJwtSecret() {
        String secret = jwtProperties.getSecret();
        if (LOCAL_DEVELOPMENT_JWT_SECRET.equals(secret)) {
            throw new IllegalStateException("Production profile cannot use the local development JWT secret.");
        }

        byte[] decodedSecret;
        try {
            decodedSecret = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Production JWT secret must be valid Base64.", exception);
        }

        if (decodedSecret.length < MINIMUM_SECRET_BYTES) {
            throw new IllegalStateException("Production JWT secret must decode to at least 32 bytes.");
        }
    }

    private void validateRefreshCookiePolicy() {
        if (!jwtProperties.isRefreshCookieSecure()) {
            throw new IllegalStateException("Production requires app.security.jwt.refresh-cookie-secure=true.");
        }

        if ("None".equalsIgnoreCase(jwtProperties.getRefreshCookieSameSite()) && !jwtProperties.isRefreshCookieSecure()) {
            throw new IllegalStateException("SameSite=None cookies require the secure flag in production.");
        }
    }

    private void validateCorsOrigins() {
        List<String> allowedOrigins = corsProperties.getAllowedOrigins();
        for (String allowedOrigin : allowedOrigins) {
            if (allowedOrigin == null || allowedOrigin.isBlank()) {
                throw new IllegalStateException("Production CORS origins cannot contain blank values.");
            }

            if ("*".equals(allowedOrigin.trim())) {
                throw new IllegalStateException("Production CORS origins cannot use a wildcard when credentials are enabled.");
            }
        }
    }
}
