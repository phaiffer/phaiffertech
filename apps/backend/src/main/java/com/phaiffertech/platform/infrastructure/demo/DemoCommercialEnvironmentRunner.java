package com.phaiffertech.platform.infrastructure.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.demo.commercial", name = "enabled", havingValue = "true")
public class DemoCommercialEnvironmentRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoCommercialEnvironmentRunner.class);

    private final DemoCommercialEnvironmentService demoCommercialEnvironmentService;

    public DemoCommercialEnvironmentRunner(DemoCommercialEnvironmentService demoCommercialEnvironmentService) {
        this.demoCommercialEnvironmentService = demoCommercialEnvironmentService;
    }

    @Override
    public void run(String... args) {
        DemoCommercialEnvironmentService.DemoCommercialSeedSummary summary = demoCommercialEnvironmentService.seed();
        log.info(
                "Commercial demo tenant '{}' ready with CRM={} and PetFlow={} seeded records for '{}'.",
                summary.tenantCode(),
                summary.crmRecords(),
                summary.petRecords(),
                summary.userEmail()
        );
    }
}
