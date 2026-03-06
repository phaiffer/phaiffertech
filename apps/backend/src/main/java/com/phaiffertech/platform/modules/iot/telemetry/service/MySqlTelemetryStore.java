package com.phaiffertech.platform.modules.iot.telemetry.service;

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

    public MySqlTelemetryStore(
            IotTelemetryRecordRepository telemetryRecordRepository,
            IotDeviceRepository deviceRepository,
            AlarmEvaluator alarmEvaluator
    ) {
        this.telemetryRecordRepository = telemetryRecordRepository;
        this.deviceRepository = deviceRepository;
        this.alarmEvaluator = alarmEvaluator;
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
        record.setMetric(normalizeMetric(request.metric()));
        record.setValue(request.value());
        record.setRecordedAt(request.recordedAt() == null ? Instant.now() : request.recordedAt());

        IotTelemetryRecord saved = telemetryRecordRepository.save(record);
        alarmEvaluator.evaluate(saved);

        return IotTelemetryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<IotTelemetryResponse> list(UUID tenantId, PageRequestDto pageRequest) {
        Page<IotTelemetryResponse> result = telemetryRecordRepository.findAllByTenantIdAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "recordedAt"))
                )
                .map(IotTelemetryMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    private String normalizeMetric(String metric) {
        return metric.trim().toLowerCase();
    }
}
