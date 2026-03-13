package com.phaiffertech.platform.modules.iot.telemetry.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import com.phaiffertech.platform.support.IntegrationTestContainersConfig;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class IotTelemetryRecordRepositoryIntegrationTest extends IntegrationTestContainersConfig {

    @Autowired
    private IotTelemetryRecordRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void findAllByTenantIdAndSearchShouldFilterByTenantAndRespectPagination() {
        UUID tenantId = UUID.randomUUID();
        UUID otherTenantId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID otherDeviceId = UUID.randomUUID();

        insertTenant(tenantId, "tenant-repo-a");
        insertTenant(otherTenantId, "tenant-repo-b");
        insertDevice(tenantId, deviceId, "device-repo-a");
        insertDevice(otherTenantId, otherDeviceId, "device-repo-b");

        UUID firstId = insertTelemetry(
                tenantId,
                deviceId,
                "temperature-line-1",
                "C",
                Instant.parse("2026-03-13T10:00:00Z"),
                null
        );
        UUID secondId = insertTelemetry(
                tenantId,
                deviceId,
                "pressure-line-1",
                "psi",
                Instant.parse("2026-03-13T11:00:00Z"),
                null
        );
        UUID thirdId = insertTelemetry(
                tenantId,
                deviceId,
                "temperature-line-2",
                "C",
                Instant.parse("2026-03-13T12:00:00Z"),
                null
        );
        insertTelemetry(
                otherTenantId,
                otherDeviceId,
                "temperature-line-other",
                "C",
                Instant.parse("2026-03-13T13:00:00Z"),
                null
        );

        Page<IotTelemetryRecord> firstPage = repository.findAllByTenantIdAndSearch(
                tenantId,
                null,
                null,
                null,
                null,
                null,
                "%temperature%",
                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "recordedAt"))
        );
        Page<IotTelemetryRecord> secondPage = repository.findAllByTenantIdAndSearch(
                tenantId,
                null,
                null,
                null,
                null,
                null,
                "%temperature%",
                PageRequest.of(1, 1, Sort.by(Sort.Direction.DESC, "recordedAt"))
        );

        assertEquals(2, firstPage.getTotalElements());
        assertEquals(2, firstPage.getTotalPages());
        assertEquals(List.of(thirdId), firstPage.map(IotTelemetryRecord::getId).getContent());
        assertEquals(List.of(firstId), secondPage.map(IotTelemetryRecord::getId).getContent());

        Page<IotTelemetryRecord> pressureSearch = repository.findAllByTenantIdAndSearch(
                tenantId,
                null,
                null,
                null,
                null,
                null,
                "%psi%",
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "recordedAt"))
        );

        assertEquals(List.of(secondId), pressureSearch.map(IotTelemetryRecord::getId).getContent());
    }

    @Test
    void findAllByTenantIdAndSearchShouldApplyDeviceRegisterMetricAndRecordedWindow() {
        UUID tenantId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID otherDeviceId = UUID.randomUUID();
        UUID registerId = UUID.randomUUID();
        UUID otherRegisterId = UUID.randomUUID();

        insertTenant(tenantId, "tenant-repo-filters");
        insertDevice(tenantId, deviceId, "device-repo-filters-a");
        insertDevice(tenantId, otherDeviceId, "device-repo-filters-b");
        insertRegister(tenantId, deviceId, registerId, "temperature", "FC03:40001");
        insertRegister(tenantId, otherDeviceId, otherRegisterId, "temperature", "FC03:40002");

        UUID beforeWindow = insertTelemetry(
                tenantId,
                deviceId,
                "temperature",
                "C",
                Instant.parse("2026-03-13T09:59:59Z"),
                registerId
        );
        UUID expected = insertTelemetry(
                tenantId,
                deviceId,
                "temperature",
                "C",
                Instant.parse("2026-03-13T10:15:00Z"),
                registerId
        );
        insertTelemetry(
                tenantId,
                deviceId,
                "humidity",
                "%",
                Instant.parse("2026-03-13T10:20:00Z"),
                registerId
        );
        insertTelemetry(
                tenantId,
                otherDeviceId,
                "temperature",
                "C",
                Instant.parse("2026-03-13T10:25:00Z"),
                otherRegisterId
        );

        Page<IotTelemetryRecord> filtered = repository.findAllByTenantIdAndSearch(
                tenantId,
                deviceId,
                registerId,
                "temperature",
                Instant.parse("2026-03-13T10:00:00Z"),
                Instant.parse("2026-03-13T10:20:00Z"),
                "%",
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "recordedAt"))
        );

        assertEquals(1, filtered.getTotalElements());
        assertIterableEquals(List.of(expected), filtered.map(IotTelemetryRecord::getId).getContent());
        assertEquals(0, filtered.getContent().stream().filter(record -> record.getId().equals(beforeWindow)).count());
    }

    private void insertTenant(UUID tenantId, String code) {
        jdbcTemplate.update(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                tenantId,
                "Tenant " + code,
                code
        );
    }

    private void insertDevice(UUID tenantId, UUID deviceId, String identifier) {
        jdbcTemplate.update(
                """
                INSERT INTO iot_devices (id, tenant_id, name, serial_number, identifier, status)
                VALUES (?, ?, ?, ?, ?, 'ONLINE')
                """,
                deviceId,
                tenantId,
                "Device " + identifier,
                "SER-" + identifier,
                identifier
        );
    }

    private void insertRegister(UUID tenantId, UUID deviceId, UUID registerId, String metricName, String code) {
        jdbcTemplate.update(
                """
                INSERT INTO iot_registers (id, tenant_id, device_id, name, code, metric_name, data_type, status)
                VALUES (?, ?, ?, ?, ?, ?, 'DECIMAL', 'ACTIVE')
                """,
                registerId,
                tenantId,
                deviceId,
                "Register " + code,
                code,
                metricName
        );
    }

    private UUID insertTelemetry(
            UUID tenantId,
            UUID deviceId,
            String metricName,
            String unit,
            Instant recordedAt,
            UUID registerId
    ) {
        UUID telemetryId = UUID.randomUUID();
        jdbcTemplate.update(
                """
                INSERT INTO iot_telemetry_records (id, tenant_id, device_id, register_id, metric_name, metric_value, unit, recorded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                telemetryId,
                tenantId,
                deviceId,
                registerId,
                metricName,
                21.5,
                unit,
                Timestamp.from(recordedAt)
        );
        return telemetryId;
    }
}
