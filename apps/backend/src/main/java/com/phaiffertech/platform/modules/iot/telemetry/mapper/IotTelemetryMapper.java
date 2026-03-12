package com.phaiffertech.platform.modules.iot.telemetry.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import lombok.extern.slf4j.Slf4j;
import java.util.Collections;
import java.util.Map;

@Slf4j
public final class IotTelemetryMapper {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private IotTelemetryMapper() {
    }

    public static IotTelemetryResponse toResponse(IotTelemetryRecord record) {
        return new IotTelemetryResponse(
                record.getId(),
                record.getDeviceId(),
                record.getRegisterId(),
                record.getMetricName(),
                record.getMetricValue(),
                record.getUnit(),
                parseMetadata(record.getMetadata()),
                record.getRecordedAt(),
                record.getCreatedAt()
        );
    }

    private static Map<String, Object> parseMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return OBJECT_MAPPER.readValue(metadata, new TypeReference<>() {
            });
        } catch (Exception e) {
            log.error("Falha no processamento de telemetria IoT: ", e);
            return Collections.emptyMap();
        }
    }
}
