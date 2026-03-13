package com.phaiffertech.platform.modules.iot.telemetry.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.Map;

@Mapper(componentModel = "spring")
public abstract class IotTelemetryMapper {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Logger log = LoggerFactory.getLogger(IotTelemetryMapper.class);

    @Mapping(target = "metadata", source = "metadata", qualifiedByName = "parseMetadata")
    public abstract IotTelemetryResponse toResponse(IotTelemetryRecord entity);

    @Mapping(target = "metadata", source = "request.metadata", qualifiedByName = "stringifyMetadata")
    @Mapping(target = "tenantId", source = "tenantId")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    public abstract IotTelemetryRecord toEntity(com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest request, java.util.UUID tenantId);

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