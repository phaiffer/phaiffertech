package com.phaiffertech.platform.shared.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

@Service
public class PlatformMetricsService {

    private final MeterRegistry meterRegistry;
    private final Counter crmContactsCreated;
    private final Counter petAppointmentsCreated;
    private final Counter iotTelemetryReceived;
    private final Counter iotAlarmsTriggered;

    public PlatformMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.crmContactsCreated = Counter.builder("crm.contacts.created")
                .description("Number of CRM contacts created")
                .register(meterRegistry);
        this.petAppointmentsCreated = Counter.builder("pet.appointments.created")
                .description("Number of PET appointments created")
                .register(meterRegistry);
        this.iotTelemetryReceived = Counter.builder("iot.telemetry.received")
                .description("Number of IoT telemetry records received")
                .register(meterRegistry);
        this.iotAlarmsTriggered = Counter.builder("iot.alarms.triggered")
                .description("Number of IoT alarms triggered")
                .register(meterRegistry);
    }

    public void recordAuthenticationAttempt(boolean success) {
        meterRegistry.counter("auth.attempts", "outcome", success ? "success" : "failure").increment();
    }

    public void incrementCrmContactsCreated() {
        crmContactsCreated.increment();
    }

    public void incrementPetAppointmentsCreated() {
        petAppointmentsCreated.increment();
    }

    public void incrementIotTelemetryReceived() {
        iotTelemetryReceived.increment();
    }

    public void incrementIotAlarmsTriggered() {
        iotAlarmsTriggered.increment();
    }
}
