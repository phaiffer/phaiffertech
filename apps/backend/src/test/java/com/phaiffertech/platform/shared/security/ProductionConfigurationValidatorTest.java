package com.phaiffertech.platform.shared.security;

import com.phaiffertech.platform.core.auth.config.DemoAccessProperties;
import com.phaiffertech.platform.infrastructure.bootstrap.MasterAdminBootstrapProperties;
import com.phaiffertech.platform.shared.config.CorsProperties;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductionConfigurationValidatorTest {

    @Test
    void shouldRejectLocalDevelopmentJwtSecret() {
        JwtProperties jwtProperties = validJwtProperties();
        jwtProperties.setSecret(ProductionConfigurationValidator.LOCAL_DEVELOPMENT_JWT_SECRET);

        ProductionConfigurationValidator validator = new ProductionConfigurationValidator(
                productionEnvironment(),
                jwtProperties,
                validCorsProperties(),
                new DemoAccessProperties(),
                new MasterAdminBootstrapProperties()
        );

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void shouldRejectWildcardCorsOriginWhenCredentialsAreEnabled() {
        JwtProperties jwtProperties = validJwtProperties();
        CorsProperties corsProperties = new CorsProperties();
        corsProperties.setAllowedOrigins(List.of("*"));

        ProductionConfigurationValidator validator = new ProductionConfigurationValidator(
                productionEnvironment(),
                jwtProperties,
                corsProperties,
                new DemoAccessProperties(),
                new MasterAdminBootstrapProperties()
        );

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void shouldRejectInsecureRefreshCookiePolicy() {
        JwtProperties jwtProperties = validJwtProperties();
        jwtProperties.setRefreshCookieSecure(false);

        ProductionConfigurationValidator validator = new ProductionConfigurationValidator(
                productionEnvironment(),
                jwtProperties,
                validCorsProperties(),
                new DemoAccessProperties(),
                new MasterAdminBootstrapProperties()
        );

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void shouldAcceptExplicitProductionSafeConfiguration() {
        ProductionConfigurationValidator validator = new ProductionConfigurationValidator(
                productionEnvironment(),
                validJwtProperties(),
                validCorsProperties(),
                new DemoAccessProperties(),
                new MasterAdminBootstrapProperties()
        );

        assertDoesNotThrow(validator::validate);
    }

    private MockEnvironment productionEnvironment() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        environment.withProperty("spring.datasource.url", "jdbc:postgresql://db.internal:5432/platform");
        environment.withProperty("spring.datasource.username", "platform");
        environment.withProperty("spring.datasource.password", "secret-value");
        return environment;
    }

    private JwtProperties validJwtProperties() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        jwtProperties.setAccessMinutes(15);
        jwtProperties.setRefreshDays(7);
        jwtProperties.setIssuer("platform-api");
        jwtProperties.setRefreshCookieSameSite("Strict");
        jwtProperties.setRefreshCookieSecure(true);
        return jwtProperties;
    }

    private CorsProperties validCorsProperties() {
        CorsProperties corsProperties = new CorsProperties();
        corsProperties.setAllowedOrigins(List.of("https://console.phaiffertech.com"));
        return corsProperties;
    }
}
