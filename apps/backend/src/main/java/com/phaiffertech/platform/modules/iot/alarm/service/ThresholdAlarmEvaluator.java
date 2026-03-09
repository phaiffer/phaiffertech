package com.phaiffertech.platform.modules.iot.alarm.service;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.processing.AlarmEvaluator;
import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThresholdAlarmEvaluator implements AlarmEvaluator {

    private static final BigDecimal TEMPERATURE_HIGH_THRESHOLD = BigDecimal.valueOf(80);
    private static final BigDecimal BATTERY_LOW_THRESHOLD = BigDecimal.valueOf(20);
    private static final List<String> OPEN_STATUSES = List.of("OPEN", "ACKNOWLEDGED");
    private static final Collection<String> REGISTER_THRESHOLD_CODES = List.of(
            "REGISTER_MIN_THRESHOLD",
            "REGISTER_MAX_THRESHOLD"
    );

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
        EvaluationOutcome outcome = evaluateDecision(telemetryRecord);
        resolveOpenAlarms(telemetryRecord, outcome.resolveCodes());

        AlarmDecision decision = outcome.decision();
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

    private EvaluationOutcome evaluateDecision(IotTelemetryRecord telemetryRecord) {
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
            return EvaluationOutcome.none(List.of("THRESHOLD_EXCEEDED"));
        }

        if ("temperature".equals(metric) && value.compareTo(TEMPERATURE_HIGH_THRESHOLD) > 0) {
            return EvaluationOutcome.triggered(
                    new AlarmDecision(
                            true,
                            "THRESHOLD_EXCEEDED",
                            resolveGenericSeverity(value, TEMPERATURE_HIGH_THRESHOLD, true),
                            buildMessage(telemetryRecord)
                    ),
                    List.of("THRESHOLD_EXCEEDED")
            );
        }
        if ("battery".equals(metric) && value.compareTo(BATTERY_LOW_THRESHOLD) < 0) {
            return EvaluationOutcome.triggered(
                    new AlarmDecision(
                            true,
                            "THRESHOLD_EXCEEDED",
                            resolveGenericSeverity(value, BATTERY_LOW_THRESHOLD, false),
                            buildMessage(telemetryRecord)
                    ),
                    List.of("THRESHOLD_EXCEEDED")
            );
        }
        return EvaluationOutcome.none(List.of("THRESHOLD_EXCEEDED"));
    }

    private EvaluationOutcome evaluateRegisterThreshold(IotTelemetryRecord telemetryRecord, IotRegister register) {
        if (!"ACTIVE".equalsIgnoreCase(register.getStatus())) {
            return EvaluationOutcome.none(REGISTER_THRESHOLD_CODES);
        }

        BigDecimal value = telemetryRecord.getValue();
        if (value == null) {
            return EvaluationOutcome.none(REGISTER_THRESHOLD_CODES);
        }

        if (register.getMinThreshold() != null && value.compareTo(register.getMinThreshold()) < 0) {
            return EvaluationOutcome.triggered(
                    new AlarmDecision(
                            true,
                            "REGISTER_MIN_THRESHOLD",
                            resolveThresholdSeverity(value, register.getMinThreshold(), false),
                            "Telemetry below minimum threshold for register " + buildRegisterLabel(register)
                                    + ": " + value + " < " + register.getMinThreshold()
                    ),
                    REGISTER_THRESHOLD_CODES
            );
        }

        if (register.getMaxThreshold() != null && value.compareTo(register.getMaxThreshold()) > 0) {
            return EvaluationOutcome.triggered(
                    new AlarmDecision(
                            true,
                            "REGISTER_MAX_THRESHOLD",
                            resolveThresholdSeverity(value, register.getMaxThreshold(), true),
                            "Telemetry above maximum threshold for register " + buildRegisterLabel(register)
                                    + ": " + value + " > " + register.getMaxThreshold()
                    ),
                    REGISTER_THRESHOLD_CODES
            );
        }

        return EvaluationOutcome.none(REGISTER_THRESHOLD_CODES);
    }

    private String buildMessage(IotTelemetryRecord telemetryRecord) {
        return "Telemetry threshold exceeded for metric "
                + telemetryRecord.getMetric()
                + " with value "
                + telemetryRecord.getValue();
    }

    private String buildRegisterLabel(IotRegister register) {
        if (register.getFunctionCode() != null && register.getRegisterAddress() != null) {
            return register.getCode() + " (" + register.getFunctionCode() + ":" + register.getRegisterAddress() + ")";
        }
        return register.getCode();
    }

    private void resolveOpenAlarms(IotTelemetryRecord telemetryRecord, Collection<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return;
        }

        List<IotAlarm> openAlarms = alarmRepository.findOpenAlarmsByCodes(
                telemetryRecord.getTenantId(),
                telemetryRecord.getDeviceId(),
                telemetryRecord.getRegisterId(),
                codes.stream().map(String::toUpperCase).toList(),
                OPEN_STATUSES
        );

        openAlarms.forEach(alarm -> alarm.setStatus("RESOLVED"));
        if (!openAlarms.isEmpty()) {
            alarmRepository.saveAll(openAlarms);
        }
    }

    private String resolveThresholdSeverity(BigDecimal value, BigDecimal threshold, boolean aboveThreshold) {
        BigDecimal delta = aboveThreshold ? value.subtract(threshold) : threshold.subtract(value);
        return isCriticalDeviation(delta, threshold) ? "CRITICAL" : "HIGH";
    }

    private String resolveGenericSeverity(BigDecimal value, BigDecimal threshold, boolean aboveThreshold) {
        BigDecimal delta = aboveThreshold ? value.subtract(threshold) : threshold.subtract(value);
        return isCriticalDeviation(delta, threshold) ? "CRITICAL" : "HIGH";
    }

    private boolean isCriticalDeviation(BigDecimal delta, BigDecimal threshold) {
        if (delta == null || threshold == null || delta.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (threshold.compareTo(BigDecimal.ZERO) == 0) {
            return true;
        }
        BigDecimal ratio = delta.abs().divide(threshold.abs(), 4, RoundingMode.HALF_UP);
        return ratio.compareTo(new BigDecimal("0.10")) >= 0;
    }

    private record AlarmDecision(boolean triggered, String code, String severity, String message) {

        private static AlarmDecision none() {
            return new AlarmDecision(false, null, null, null);
        }
    }

    private record EvaluationOutcome(AlarmDecision decision, Collection<String> resolveCodes) {

        private static EvaluationOutcome triggered(AlarmDecision decision, Collection<String> resolveCodes) {
            return new EvaluationOutcome(decision, resolveCodes);
        }

        private static EvaluationOutcome none(Collection<String> resolveCodes) {
            return new EvaluationOutcome(AlarmDecision.none(), resolveCodes);
        }
    }
}
