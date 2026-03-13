package com.phaiffertech.platform.modules.iot.telemetry.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import org.mapstruct.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import java.util.Map;

@org.springframework.stereotype.Component
public class IotTelemetryMapper {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Logger log = LoggerFactory.getLogger(IotTelemetryMapper.class);

    public IotTelemetryResponse toResponse(IotTelemetryRecord entity) {
        if (entity == null) {
            return null;
        }
        return new IotTelemetryResponse(
                entity.getId(),
                entity.getDeviceId(),
                entity.getRegisterId(),
                entity.getMetricName(),
                entity.getMetricValue(),
                entity.getUnit(),
                parseMetadata(entity.getMetadata()),
                entity.getRecordedAt(),
                entity.getCreatedAt()
        );
    }

    public IotTelemetryRecord toEntity(IotTelemetryCreateRequest request, java.util.UUID tenantId) {
        if (request == null) {
            return null;
        }
        IotTelemetryRecord record = new IotTelemetryRecord();
        record.setTenantId(tenantId);
        record.setDeviceId(request.deviceId());
        record.setRegisterId(request.registerId());
        record.setMetricName(request.metricName());
        record.setMetricValue(request.metricValue());
        record.setUnit(request.unit());
        record.setRecordedAt(request.recordedAt());
        record.setMetadata(stringifyMetadata(request.metadata()));
        return record;
    }

    @Named("stringifyMetadata")
    protected String stringifyMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(metadata);
        } catch (Exception e) {
            log.error("Falha ao converter metadata para string: ", e);
            return null;
        }
    }

    @Named("parseMetadata")
    protected Map<String, Object> parseMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return OBJECT_MAPPER.readValue(metadata, new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Falha no processamento de telemetria IoT: ", e);
            return Collections.emptyMap();
        }
    }
}
