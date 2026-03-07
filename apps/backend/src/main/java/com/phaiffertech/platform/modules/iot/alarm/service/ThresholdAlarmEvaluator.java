package com.phaiffertech.platform.modules.iot.alarm.service;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.processing.AlarmEvaluator;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThresholdAlarmEvaluator implements AlarmEvaluator {

    private static final BigDecimal TEMPERATURE_HIGH_THRESHOLD = BigDecimal.valueOf(80);
    private static final BigDecimal BATTERY_LOW_THRESHOLD = BigDecimal.valueOf(20);

    private final IotAlarmRepository alarmRepository;

    public ThresholdAlarmEvaluator(IotAlarmRepository alarmRepository) {
        this.alarmRepository = alarmRepository;
    }

    @Override
    @Transactional
    public void evaluate(IotTelemetryRecord telemetryRecord) {
        if (!shouldCreateAlarm(telemetryRecord)) {
            return;
        }

        IotAlarm alarm = new IotAlarm();
        alarm.setTenantId(telemetryRecord.getTenantId());
        alarm.setDeviceId(telemetryRecord.getDeviceId());
        alarm.setCode("THRESHOLD_EXCEEDED");
        alarm.setSeverity("HIGH");
        alarm.setStatus("OPEN");
        alarm.setTriggeredAt(telemetryRecord.getRecordedAt());
        alarm.setMessage(buildMessage(telemetryRecord));

        alarmRepository.save(alarm);
    }

    private boolean shouldCreateAlarm(IotTelemetryRecord telemetryRecord) {
        String metric = telemetryRecord.getMetric() == null ? "" : telemetryRecord.getMetric().trim().toLowerCase();
        BigDecimal value = telemetryRecord.getValue();
        if (value == null) {
            return false;
        }

        return ("temperature".equals(metric) && value.compareTo(TEMPERATURE_HIGH_THRESHOLD) > 0)
                || ("battery".equals(metric) && value.compareTo(BATTERY_LOW_THRESHOLD) < 0);
    }

    private String buildMessage(IotTelemetryRecord telemetryRecord) {
        return "Telemetry threshold exceeded for metric "
                + telemetryRecord.getMetric()
                + " with value "
                + telemetryRecord.getValue();
    }
}
