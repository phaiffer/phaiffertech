package com.phaiffertech.platform.modules.iot.alarm.service;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.processing.AlarmEvaluator;
import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThresholdAlarmEvaluator implements AlarmEvaluator {

    private static final BigDecimal TEMPERATURE_HIGH_THRESHOLD = BigDecimal.valueOf(80);
    private static final BigDecimal BATTERY_LOW_THRESHOLD = BigDecimal.valueOf(20);
    private static final List<String> OPEN_STATUSES = List.of("OPEN", "ACKNOWLEDGED");

    private final IotAlarmRepository alarmRepository;
    private final IotRegisterRepository registerRepository;
    private final PlatformMetricsService platformMetricsService;

    public ThresholdAlarmEvaluator(
            IotAlarmRepository alarmRepository,
            IotRegisterRepository registerRepository,
            PlatformMetricsService platformMetricsService
    ) {
        this.alarmRepository = alarmRepository;
        this.registerRepository = registerRepository;
        this.platformMetricsService = platformMetricsService;
    }

    @Override
    @Transactional
    public void evaluate(IotTelemetryRecord telemetryRecord) {
        AlarmDecision decision = evaluateDecision(telemetryRecord);
        if (!decision.triggered()) {
            return;
        }

        boolean alreadyOpen = alarmRepository.existsOpenAlarm(
                telemetryRecord.getTenantId(),
                telemetryRecord.getDeviceId(),
                telemetryRecord.getRegisterId(),
                decision.code(),
                OPEN_STATUSES
        );
        if (alreadyOpen) {
            return;
        }

        IotAlarm alarm = new IotAlarm();
        alarm.setTenantId(telemetryRecord.getTenantId());
        alarm.setDeviceId(telemetryRecord.getDeviceId());
        alarm.setRegisterId(telemetryRecord.getRegisterId());
        alarm.setCode(decision.code());
        alarm.setSeverity(decision.severity());
        alarm.setStatus("OPEN");
        alarm.setTriggeredAt(telemetryRecord.getRecordedAt());
        alarm.setMessage(decision.message());

        alarmRepository.save(alarm);
        platformMetricsService.incrementIotAlarmsTriggered();
    }

    private AlarmDecision evaluateDecision(IotTelemetryRecord telemetryRecord) {
        if (telemetryRecord.getRegisterId() != null) {
            IotRegister register = registerRepository.findByIdAndTenantId(
                    telemetryRecord.getRegisterId(),
                    telemetryRecord.getTenantId()
            ).orElse(null);
            if (register != null) {
                return evaluateRegisterThreshold(telemetryRecord, register);
            }
        }

        String metric = telemetryRecord.getMetric() == null ? "" : telemetryRecord.getMetric().trim().toLowerCase();
        BigDecimal value = telemetryRecord.getValue();
        if (value == null) {
            return AlarmDecision.none();
        }

        if ("temperature".equals(metric) && value.compareTo(TEMPERATURE_HIGH_THRESHOLD) > 0) {
            return new AlarmDecision(
                    true,
                    "THRESHOLD_EXCEEDED",
                    "HIGH",
                    buildMessage(telemetryRecord)
            );
        }
        if ("battery".equals(metric) && value.compareTo(BATTERY_LOW_THRESHOLD) < 0) {
            return new AlarmDecision(
                    true,
                    "THRESHOLD_EXCEEDED",
                    "HIGH",
                    buildMessage(telemetryRecord)
            );
        }
        return AlarmDecision.none();
    }

    private AlarmDecision evaluateRegisterThreshold(IotTelemetryRecord telemetryRecord, IotRegister register) {
        BigDecimal value = telemetryRecord.getValue();
        if (value == null) {
            return AlarmDecision.none();
        }

        if (register.getMinThreshold() != null && value.compareTo(register.getMinThreshold()) < 0) {
            return new AlarmDecision(
                    true,
                    "REGISTER_MIN_THRESHOLD",
                    "CRITICAL",
                    "Telemetry below minimum threshold for register " + register.getCode()
                            + ": " + value + " < " + register.getMinThreshold()
            );
        }

        if (register.getMaxThreshold() != null && value.compareTo(register.getMaxThreshold()) > 0) {
            return new AlarmDecision(
                    true,
                    "REGISTER_MAX_THRESHOLD",
                    "CRITICAL",
                    "Telemetry above maximum threshold for register " + register.getCode()
                            + ": " + value + " > " + register.getMaxThreshold()
            );
        }

        return AlarmDecision.none();
    }

    private String buildMessage(IotTelemetryRecord telemetryRecord) {
        return "Telemetry threshold exceeded for metric "
                + telemetryRecord.getMetric()
                + " with value "
                + telemetryRecord.getValue();
    }

    private record AlarmDecision(boolean triggered, String code, String severity, String message) {

        private static AlarmDecision none() {
            return new AlarmDecision(false, null, null, null);
        }
    }
}
