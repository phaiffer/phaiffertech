package com.phaiffertech.platform.modules.iot.telemetry.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.processing.AlarmEvaluator;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusService;
import com.phaiffertech.platform.modules.iot.processing.IotPollingProfileSupport;
import com.phaiffertech.platform.modules.iot.processing.TelemetryReader;
import com.phaiffertech.platform.modules.iot.processing.TelemetryWriter;
import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
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
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PostgresTelemetryStore implements TelemetryWriter, TelemetryReader {

    private static final Duration MAX_FUTURE_CLOCK_SKEW = Duration.ofMinutes(5);

    private final IotTelemetryRecordRepository telemetryRecordRepository;
    private final IotDeviceRepository deviceRepository;
    private final IotRegisterRepository registerRepository;
    private final AlarmEvaluator alarmEvaluator;
    private final DeviceStatusService deviceStatusService;
    private final ObjectMapper objectMapper;
    private final PlatformMetricsService platformMetricsService;

    public PostgresTelemetryStore(
            IotTelemetryRecordRepository telemetryRecordRepository,
            IotDeviceRepository deviceRepository,
            IotRegisterRepository registerRepository,
            AlarmEvaluator alarmEvaluator,
            DeviceStatusService deviceStatusService,
            ObjectMapper objectMapper,
            PlatformMetricsService platformMetricsService
    ) {
        this.telemetryRecordRepository = telemetryRecordRepository;
        this.deviceRepository = deviceRepository;
        this.registerRepository = registerRepository;
        this.alarmEvaluator = alarmEvaluator;
        this.deviceStatusService = deviceStatusService;
        this.objectMapper = objectMapper;
        this.platformMetricsService = platformMetricsService;
    }

    @Override
    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_telemetry_record")
    public IotTelemetryResponse write(UUID tenantId, IotTelemetryCreateRequest request) {
        IotDevice device = deviceRepository.findByIdAndTenantId(request.deviceId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found for tenant."));
        Instant recordedAt = request.recordedAt() == null ? Instant.now() : request.recordedAt();
        validateRecordedAt(recordedAt);

        IotRegister register = resolveRegister(tenantId, request);
        validateMetricValue(request.metricValue(), register);

        IotTelemetryRecord record = new IotTelemetryRecord();
        record.setTenantId(tenantId);
        record.setDeviceId(request.deviceId());
        record.setRegisterId(register == null ? null : register.getId());
        record.setMetricName(resolveMetricName(request, register));
        record.setMetricValue(request.metricValue());
        record.setUnit(resolveUnit(request.unit(), register));
        record.setMetadata(toJson(enrichMetadata(request.metadata(), device, register, recordedAt)));
        record.setRecordedAt(recordedAt);

        IotTelemetryRecord saved = telemetryRecordRepository.save(record);
        alarmEvaluator.evaluate(saved);
        deviceStatusService.refreshFromTelemetry(tenantId, request.deviceId(), saved.getRecordedAt());
        platformMetricsService.incrementIotTelemetryReceived();

        return IotTelemetryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<IotTelemetryResponse> list(
            UUID tenantId,
            PageRequestDto pageRequest,
            UUID deviceId,
            UUID registerId,
            String metricName,
            Instant recordedFrom,
            Instant recordedTo
    ) {
        Page<IotTelemetryResponse> result = telemetryRecordRepository.findAllByTenantIdAndSearch(
                        tenantId,
                        deviceId,
                        registerId,
                        normalizeMetric(metricName),
                        recordedFrom,
                        recordedTo,
                        pageRequest.normalizedSearchPattern(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "recordedAt"))
                )
                .map(IotTelemetryMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    private IotRegister resolveRegister(UUID tenantId, IotTelemetryCreateRequest request) {
        if (request.registerId() == null) {
            IotRegister registerByMapping = resolveRegisterByExplicitMapping(tenantId, request.deviceId(), request.metadata());
            if (registerByMapping != null) {
                return registerByMapping;
            }
            return resolveRegisterByMetricName(tenantId, request.deviceId(), request.metricName());
        }

        IotRegister register = registerRepository.findByIdAndTenantId(request.registerId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT register not found for tenant."));
        if (!register.getDeviceId().equals(request.deviceId())) {
            throw new IllegalArgumentException("Telemetry register does not belong to the informed device.");
        }
        return register;
    }

    private IotRegister resolveRegisterByExplicitMapping(UUID tenantId, UUID deviceId, Map<String, Object> metadata) {
        ModbusMapping mapping = resolveModbusMapping(metadata);
        if (mapping == null) {
            return null;
        }
        return registerRepository.findByTenantIdAndDeviceIdAndFunctionCodeIgnoreCaseAndRegisterAddressAndDeletedAtIsNull(
                        tenantId,
                        deviceId,
                        mapping.functionCode(),
                        mapping.registerAddress()
                )
                .orElse(null);
    }

    private IotRegister resolveRegisterByMetricName(UUID tenantId, UUID deviceId, String metricName) {
        String normalizedMetric = normalizeMetric(metricName);
        if (normalizedMetric == null) {
            return null;
        }

        List<IotRegister> matches = registerRepository.findAllByTenantIdAndDeviceIdAndMetricNameIgnoreCaseAndDeletedAtIsNull(
                tenantId,
                deviceId,
                normalizedMetric
        );
        return matches.size() == 1 ? matches.get(0) : null;
    }

    private String resolveMetricName(IotTelemetryCreateRequest request, IotRegister register) {
        if (register != null && register.getMetricName() != null && !register.getMetricName().isBlank()) {
            return normalizeMetric(register.getMetricName());
        }
        return normalizeMetric(request.metricName());
    }

    private String resolveUnit(String requestUnit, IotRegister register) {
        if (requestUnit != null && !requestUnit.isBlank()) {
            return normalizeUnit(requestUnit);
        }
        if (register != null && register.getUnit() != null && !register.getUnit().isBlank()) {
            return normalizeUnit(register.getUnit());
        }
        return null;
    }

    private void validateRecordedAt(Instant recordedAt) {
        if (recordedAt != null && recordedAt.isAfter(Instant.now().plus(MAX_FUTURE_CLOCK_SKEW))) {
            throw new IllegalArgumentException("Telemetry recordedAt cannot be more than 5 minutes in the future.");
        }
    }

    private void validateMetricValue(BigDecimal metricValue, IotRegister register) {
        if (register == null || metricValue == null) {
            return;
        }

        String dataType = register.getDataType() == null ? "" : register.getDataType().trim().toUpperCase();
        switch (dataType) {
            case "BOOLEAN" -> {
                if (!(BigDecimal.ZERO.compareTo(metricValue) == 0 || BigDecimal.ONE.compareTo(metricValue) == 0)) {
                    throw new IllegalArgumentException("BOOLEAN telemetry values must be 0 or 1.");
                }
            }
            case "UINT16" -> validateRange(metricValue, BigDecimal.ZERO, BigDecimal.valueOf(65535), "UINT16");
            case "UINT32" -> validateRange(metricValue, BigDecimal.ZERO, new BigDecimal("4294967295"), "UINT32");
            case "INT16" -> validateRange(metricValue, BigDecimal.valueOf(-32768), BigDecimal.valueOf(32767), "INT16");
            case "INT32" -> validateRange(metricValue, BigDecimal.valueOf(Integer.MIN_VALUE), BigDecimal.valueOf(Integer.MAX_VALUE), "INT32");
            default -> {
            }
        }
    }

    private void validateRange(BigDecimal value, BigDecimal min, BigDecimal max, String label) {
        if (value.compareTo(min) < 0 || value.compareTo(max) > 0) {
            throw new IllegalArgumentException("Telemetry value is outside the supported " + label + " range.");
        }
    }

    private Map<String, Object> enrichMetadata(
            Map<String, Object> requestMetadata,
            IotDevice device,
            IotRegister register,
            Instant recordedAt
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        if (requestMetadata != null) {
            metadata.putAll(requestMetadata);
        }

        metadata.putIfAbsent("source", "api");
        metadata.put("quality", resolveQuality(device, register, recordedAt));
        metadata.put("mapped", register != null);
        metadata.put("deviceIdentifier", device.getIdentifier());

        if (device.getTransport() != null) {
            metadata.put("transport", device.getTransport());
        }
        if (device.getUnitId() != null) {
            metadata.put("unitId", device.getUnitId());
        }
        if (device.getPollingProfile() != null) {
            metadata.put("pollingProfile", device.getPollingProfile());
        }

        if (register != null) {
            metadata.put("registerCode", register.getCode());
            metadata.put("registerStatus", register.getStatus());
            metadata.put("dataType", register.getDataType());
            if (register.getFunctionCode() != null) {
                metadata.put("functionCode", register.getFunctionCode());
            }
            if (register.getRegisterAddress() != null) {
                metadata.put("registerAddress", register.getRegisterAddress());
            }
        }

        return metadata;
    }

    private String resolveQuality(IotDevice device, IotRegister register, Instant recordedAt) {
        if (!IotPollingProfileSupport.isFresh(recordedAt, device.getPollingProfile(), Instant.now())) {
            return "STALE";
        }
        if (register == null) {
            return "WARN";
        }
        return "ACTIVE".equalsIgnoreCase(register.getStatus()) ? "GOOD" : "WARN";
    }

    private String normalizeMetric(String metric) {
        if (metric == null || metric.isBlank()) {
            return null;
        }
        return metric.trim().toLowerCase();
    }

    private String normalizeUnit(String unit) {
        if (unit == null || unit.isBlank()) {
            return null;
        }
        return unit.trim().toLowerCase();
    }

    private ModbusMapping resolveModbusMapping(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }

        String functionCode = normalizeFunctionCode(asString(
                firstNonNull(metadata.get("functionCode"), metadata.get("function_code"))
        ));
        Integer registerAddress = asInteger(firstNonNull(
                metadata.get("registerAddress"),
                metadata.get("register_address"),
                metadata.get("offset")
        ));

        if (functionCode == null || registerAddress == null) {
            return null;
        }

        return new ModbusMapping(functionCode, registerAddress);
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private Integer asInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException e) {
            log.error("Falha no processamento de telemetria IoT: ", e);
            return null;
        }
    }

    private String normalizeFunctionCode(String functionCode) {
        if (functionCode == null || functionCode.isBlank()) {
            return null;
        }
        return functionCode.trim().toUpperCase();
    }

    private String toJson(Object metadata) {
        if (metadata == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.error("Falha no processamento de telemetria IoT: ", e);
            return null;
        }
    }

    private record ModbusMapping(String functionCode, Integer registerAddress) {
    }
}
