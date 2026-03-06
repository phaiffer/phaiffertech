package com.phaiffertech.platform.modules.iot.telemetry.mapper;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;

public final class IotTelemetryMapper {

    private IotTelemetryMapper() {
    }

    public static IotTelemetryResponse toResponse(IotTelemetryRecord record) {
        return new IotTelemetryResponse(
                record.getId(),
                record.getDeviceId(),
                record.getMetric(),
                record.getValue(),
                record.getRecordedAt(),
                record.getCreatedAt()
        );
    }
}
