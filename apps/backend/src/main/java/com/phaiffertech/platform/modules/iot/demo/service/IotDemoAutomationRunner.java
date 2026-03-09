package com.phaiffertech.platform.modules.iot.demo.service;

import com.phaiffertech.platform.modules.iot.demo.config.IotDemoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@ConditionalOnProperty(prefix = "app.iot.demo", name = "enabled", havingValue = "true")
public class IotDemoAutomationRunner {

    private static final Logger log = LoggerFactory.getLogger(IotDemoAutomationRunner.class);

    private final IotDemoScenarioService scenarioService;
    private final IotDemoProperties properties;

    public IotDemoAutomationRunner(IotDemoScenarioService scenarioService, IotDemoProperties properties) {
        this.scenarioService = scenarioService;
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeDemoScenario() {
        if (properties.isSeedOnStartup()) {
            var summary = scenarioService.ensureDemoBase();
            log.info(
                    "IoT demo base ready for tenant '{}' with {} devices, {} registers and {} maintenance records.",
                    properties.getTenantCode(),
                    summary.totalDevices(),
                    summary.totalRegisters(),
                    summary.totalMaintenance()
            );
        }

        var tick = scenarioService.generateTick();
        log.info(
                "IoT demo live generation started at cycle {} with {} telemetry points emitted.",
                tick.cycle(),
                tick.telemetryPoints()
        );
    }

    @Scheduled(
            fixedDelayString = "#{@iotDemoProperties.generationIntervalMs}",
            initialDelayString = "#{@iotDemoProperties.initialDelayMs}"
    )
    public void generateTelemetry() {
        var tick = scenarioService.generateTick();
        log.debug(
                "IoT demo cycle {} emitted {} telemetry points and created {} maintenance orders.",
                tick.cycle(),
                tick.telemetryPoints(),
                tick.maintenanceCreated()
        );
    }
}
