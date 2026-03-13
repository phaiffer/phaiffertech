package com.phaiffertech.platform.modules.iot.telemetry.service;

import com.phaiffertech.platform.modules.iot.processing.TelemetryReader;
import com.phaiffertech.platform.modules.iot.processing.TelemetryWriter;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import com.phaiffertech.platform.modules.iot.telemetry.mapper.IotTelemetryMapper;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.repository.IotTelemetryRecordRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostgresTelemetryStore implements TelemetryWriter, TelemetryReader {

    private final IotTelemetryRecordRepository repository;
    private final IotTelemetryMapper mapper;

    @Override
    @Transactional
    public IotTelemetryResponse write(UUID tenantId, IotTelemetryCreateRequest request) {
        IotTelemetryRecord record = mapper.toEntity(request, tenantId);

        if (record.getRecordedAt() == null) {
            record.setRecordedAt(Instant.now());
        }

        record = repository.save(record);
        return mapper.toResponse(record);
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
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "recordedAt"));
        Page<IotTelemetryResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        deviceId,
                        registerId,
                        normalizeMetric(metricName),
                        recordedFrom,
                        recordedTo,
                        query.search(),
                        query.pageable()
                )
                .map(mapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    private String normalizeMetric(String metricName) {
        if (metricName == null || metricName.isBlank()) {
            return null;
        }
        return metricName.trim().toLowerCase();
    }
}
