package com.phaiffertech.platform.modules.iot.telemetry.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.processing.AlarmEvaluator;
import com.phaiffertech.platform.modules.iot.processing.TelemetryReader;
import com.phaiffertech.platform.modules.iot.processing.TelemetryWriter;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import com.phaiffertech.platform.modules.iot.telemetry.mapper.IotTelemetryMapper;
import com.phaiffertech.platform.modules.iot.telemetry.repository.IotTelemetryRecordRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MySqlTelemetryStore implements TelemetryWriter, TelemetryReader {

    private final IotTelemetryRecordRepository telemetryRecordRepository;
    private final IotDeviceRepository deviceRepository;
    private final AlarmEvaluator alarmEvaluator;
    private final ObjectMapper objectMapper;
    private final PlatformMetricsService platformMetricsService;

    public MySqlTelemetryStore(
            IotTelemetryRecordRepository telemetryRecordRepository,
            IotDeviceRepository deviceRepository,
            AlarmEvaluator alarmEvaluator,
            ObjectMapper objectMapper,
            PlatformMetricsService platformMetricsService
    ) {
        this.telemetryRecordRepository = telemetryRecordRepository;
        this.deviceRepository = deviceRepository;
        this.alarmEvaluator = alarmEvaluator;
        this.objectMapper = objectMapper;
        this.platformMetricsService = platformMetricsService;
    }

    @Override
    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_telemetry_record")
    public IotTelemetryResponse write(UUID tenantId, IotTelemetryCreateRequest request) {
        deviceRepository.findByIdAndTenantId(request.deviceId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found for tenant."));

        IotTelemetryRecord record = new IotTelemetryRecord();
        record.setTenantId(tenantId);
        record.setDeviceId(request.deviceId());
        record.setMetricName(normalizeMetric(request.metricName()));
        record.setMetricValue(request.metricValue());
        record.setUnit(normalizeUnit(request.unit()));
        record.setMetadata(toJson(request.metadata()));
        record.setRecordedAt(request.recordedAt() == null ? Instant.now() : request.recordedAt());

        IotTelemetryRecord saved = telemetryRecordRepository.save(record);
        alarmEvaluator.evaluate(saved);
        platformMetricsService.incrementIotTelemetryReceived();

        return IotTelemetryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<IotTelemetryResponse> list(
            UUID tenantId,
            PageRequestDto pageRequest,
            UUID deviceId,
            Instant recordedFrom,
            Instant recordedTo
    ) {
        Page<IotTelemetryResponse> result = telemetryRecordRepository.findAllByTenantIdAndSearch(
                        tenantId,
                        deviceId,
                        recordedFrom,
                        recordedTo,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "recordedAt"))
                )
                .map(IotTelemetryMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    private String normalizeMetric(String metric) {
        return metric.trim().toLowerCase();
    }

    private String normalizeUnit(String unit) {
        if (unit == null || unit.isBlank()) {
            return null;
        }
        return unit.trim().toLowerCase();
    }

    private String toJson(Object metadata) {
        if (metadata == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException ignored) {
            return null;
        }
    }
}
