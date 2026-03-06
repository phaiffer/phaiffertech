package com.phaiffertech.platform.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;

public abstract class IntegrationTestContainersConfig {

    private static final String DOCKER_API_VERSION = "1.44";

    protected static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("platform_db")
            .withUsername("platform_user")
            .withPassword("platform_pass");

    static {
        if (System.getProperty("api.version") == null || System.getProperty("api.version").isBlank()) {
            System.setProperty("api.version", DOCKER_API_VERSION);
        }
        MYSQL.start();
    }

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("app.security.jwt.secret", () -> "ZmFrZV9qd3Rfc2VjcmV0X2Zvcl9kZXZlbG9wbWVudF9vbmx5XzEyMzQ1");
    }
}
