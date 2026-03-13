package com.phaiffertech.platform.shared.security;

import com.phaiffertech.platform.core.auth.config.DemoAccessProperties;
import com.phaiffertech.platform.infrastructure.bootstrap.MasterAdminBootstrapProperties;
import java.util.Arrays;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ProductionConfigurationValidator {

    private final Environment environment;
    private final JwtProperties jwtProperties;
    private final DemoAccessProperties demoAccessProperties;
    private final MasterAdminBootstrapProperties masterAdminBootstrapProperties;

    public ProductionConfigurationValidator(
            Environment environment,
            JwtProperties jwtProperties,
            DemoAccessProperties demoAccessProperties,
            MasterAdminBootstrapProperties masterAdminBootstrapProperties
    ) {
        this.environment = environment;
        this.jwtProperties = jwtProperties;
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

            if (!jwtProperties.isRefreshCookieSecure()) {
                throw new IllegalStateException("Production requires app.security.jwt.refresh-cookie-secure=true.");
            }
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
}
