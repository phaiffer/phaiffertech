package com.phaiffertech.platform.modules.iot.telemetry.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phaiffertech.platform.modules.iot.processing.AlarmEvaluator;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusService;
import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import com.phaiffertech.platform.modules.iot.telemetry.mapper.IotTelemetryMapper;
import com.phaiffertech.platform.modules.iot.telemetry.repository.IotTelemetryRecordRepository;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PostgresTelemetryStoreTest {

    @Mock
    private IotTelemetryRecordRepository repository;

    @Captor
    private ArgumentCaptor<IotTelemetryRecord> telemetryRecordCaptor;

    @Captor
    private ArgumentCaptor<Pageable> pageableCaptor;

    @Mock
    private AlarmEvaluator alarmEvaluator;

    @Mock
    private DeviceStatusService deviceStatusService;

    private PostgresTelemetryStore store;

    @BeforeEach
    void setUp() {
        IotTelemetryMapper mapper = new IotTelemetryMapper();
        store = new PostgresTelemetryStore(repository, mapper, List.of(alarmEvaluator), deviceStatusService);
    }

    @Test
    void writeShouldPersistMappedEntityAndPopulateRecordedAtWhenMissing() {
        UUID tenantId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID registerId = UUID.randomUUID();
        UUID telemetryId = UUID.randomUUID();
        Instant createdAt = Instant.parse("2026-03-13T12:00:00Z");

        IotTelemetryCreateRequest request = new IotTelemetryCreateRequest(
                deviceId,
                registerId,
                "temperature",
                new BigDecimal("21.50"),
                "C",
                Map.of("source", "sensor-a"),
                null
        );

        when(repository.save(telemetryRecordCaptor.capture())).thenAnswer(invocation -> {
            IotTelemetryRecord record = invocation.getArgument(0);
            ReflectionTestUtils.setField(record, "id", telemetryId);
            ReflectionTestUtils.setField(record, "createdAt", createdAt);
            return record;
        });

        IotTelemetryResponse response = store.write(tenantId, request);

        IotTelemetryRecord persisted = telemetryRecordCaptor.getValue();
        assertEquals(tenantId, persisted.getTenantId());
        assertEquals(deviceId, persisted.getDeviceId());
        assertEquals(registerId, persisted.getRegisterId());
        assertNotNull(persisted.getRecordedAt());
        assertTrue(persisted.getMetadata().contains("\"source\":\"sensor-a\""));

        assertEquals(telemetryId, response.id());
        assertEquals(deviceId, response.deviceId());
        assertEquals(registerId, response.registerId());
        assertEquals("temperature", response.metricName());
        assertEquals(new BigDecimal("21.50"), response.metricValue());
        assertEquals("sensor-a", response.metadata().get("source"));
        assertEquals(createdAt, response.createdAt());
        assertNotNull(response.recordedAt());

        verify(alarmEvaluator).evaluate(persisted);
        verify(deviceStatusService).refreshFromTelemetry(tenantId, deviceId, persisted.getRecordedAt());
    }

    @Test
    void listShouldUseTenantAwareFiltersPaginationAndMapResult() {
        UUID tenantId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID registerId = UUID.randomUUID();
        Instant recordedFrom = Instant.parse("2026-03-10T00:00:00Z");
        Instant recordedTo = Instant.parse("2026-03-13T23:59:59Z");

        IotTelemetryRecord first = telemetryRecord(
                tenantId,
                deviceId,
                registerId,
                "temperature",
                "{\"source\":\"sensor-a\"}",
                Instant.parse("2026-03-13T10:15:30Z"),
                Instant.parse("2026-03-13T10:15:31Z")
        );
        IotTelemetryRecord second = telemetryRecord(
                tenantId,
                deviceId,
                registerId,
                "temperature",
                "{\"source\":\"sensor-b\"}",
                Instant.parse("2026-03-13T10:10:30Z"),
                Instant.parse("2026-03-13T10:10:31Z")
        );

        when(repository.findAllByTenantIdAndSearch(
                eq(tenantId),
                eq(deviceId),
                eq(registerId),
                eq("temperature"),
                eq(recordedFrom),
                eq(recordedTo),
                eq("%temp%"),
                pageableCaptor.capture()
        )).thenReturn(new PageImpl<>(
                List.of(first, second),
                PageRequest.of(1, 2, Sort.by(Sort.Direction.DESC, "recordedAt")),
                5
        ));

        PageResponseDto<IotTelemetryResponse> response = store.list(
                tenantId,
                new PageRequestDto(1, 2, null, null, " Temp "),
                deviceId,
                registerId,
                " Temperature ",
                recordedFrom,
                recordedTo
        );

        Pageable pageable = pageableCaptor.getValue();
        assertEquals(1, pageable.getPageNumber());
        assertEquals(2, pageable.getPageSize());
        assertEquals(Sort.Direction.DESC, pageable.getSort().getOrderFor("recordedAt").getDirection());

        assertEquals(2, response.items().size());
        assertEquals(1, response.page());
        assertEquals(2, response.size());
        assertEquals(5, response.totalItems());
        assertEquals(3, response.totalPages());
        assertEquals("sensor-a", response.items().get(0).metadata().get("source"));
        assertEquals("sensor-b", response.items().get(1).metadata().get("source"));

        verify(repository).findAllByTenantIdAndSearch(
                eq(tenantId),
                eq(deviceId),
                eq(registerId),
                eq("temperature"),
                eq(recordedFrom),
                eq(recordedTo),
                eq("%temp%"),
                eq(pageable)
        );
    }

    private IotTelemetryRecord telemetryRecord(
            UUID tenantId,
            UUID deviceId,
            UUID registerId,
            String metricName,
            String metadata,
            Instant recordedAt,
            Instant createdAt
    ) {
        IotTelemetryRecord record = new IotTelemetryRecord();
        record.setTenantId(tenantId);
        record.setDeviceId(deviceId);
        record.setRegisterId(registerId);
        record.setMetricName(metricName);
        record.setMetricValue(new BigDecimal("21.50"));
        record.setUnit("C");
        record.setMetadata(metadata);
        record.setRecordedAt(recordedAt);
        ReflectionTestUtils.setField(record, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(record, "createdAt", createdAt);
        return record;
    }
}
