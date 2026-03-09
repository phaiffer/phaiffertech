package com.phaiffertech.platform.modules.iot.demo.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@Profile("dev")
@ConditionalOnProperty(prefix = "app.iot.demo", name = "enabled", havingValue = "true")
public class IotDemoAutomationConfiguration {
}
