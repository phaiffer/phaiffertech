package com.phaiffertech.platform.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

public abstract class IntegrationTestContainersConfig {

    private static final String DEFAULT_DOCKER_API_VERSION = "1.44";

    protected static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("platform_db")
            .withUsername("platform_user")
            .withPassword("platform_pass");

    static {
        String configuredApiVersion = System.getenv("DOCKER_API_VERSION");
        if (configuredApiVersion == null || configuredApiVersion.isBlank()) {
            configuredApiVersion = DEFAULT_DOCKER_API_VERSION;
        }
        System.setProperty("api.version", configuredApiVersion);
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("app.security.jwt.secret", () -> "ZmFrZV9qd3Rfc2VjcmV0X2Zvcl9kZXZlbG9wbWVudF9vbmx5XzEyMzQ1");
    }
}
