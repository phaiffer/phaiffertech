package com.phaiffertech.platform.modules.iot.processing;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;

public interface AlarmEvaluator {

    void evaluate(IotTelemetryRecord telemetryRecord);
}
