package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.modules.iot.demo.config.IotDemoProperties;
import com.phaiffertech.platform.modules.iot.demo.service.IotDemoScenarioService;
import com.phaiffertech.platform.modules.iot.monitoring.service.IotDashboardService;
import com.phaiffertech.platform.modules.iot.report.service.IotReportService;
import com.phaiffertech.platform.modules.iot.telemetry.repository.IotTelemetryRecordRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IotDemoScenarioIntegrationTest extends AbstractIntegrationTest {

    private static final String DEMO_IDENTIFIER_PATTERN = "DEMO-IOT-%";

    @Autowired
    private IotDemoScenarioService demoScenarioService;

    @Autowired
    private IotDemoProperties demoProperties;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private IotTelemetryRecordRepository telemetryRecordRepository;

    @Autowired
    private IotDashboardService dashboardService;

    @Autowired
    private IotReportService reportService;

    @AfterEach
    void cleanupDemoData() {
        demoProperties.setMode("demo");
        UUID tenantId = defaultTenantId();

        executeSql(
                """
                DELETE FROM iot_maintenance
                WHERE tenant_id = ?
                  AND (
                    title LIKE 'DEMO - %'
                    OR device_id IN (
                        SELECT id
                        FROM iot_devices
                        WHERE tenant_id = ?
                          AND identifier LIKE ?
                    )
                  )
                """,
                tenantId.toString(),
                tenantId.toString(),
                DEMO_IDENTIFIER_PATTERN
        );
        executeSql(
                """
                DELETE FROM iot_alarms
                WHERE tenant_id = ?
                  AND device_id IN (
                      SELECT id
                      FROM iot_devices
                      WHERE tenant_id = ?
                        AND identifier LIKE ?
                  )
                """,
                tenantId.toString(),
                tenantId.toString(),
                DEMO_IDENTIFIER_PATTERN
        );
        executeSql(
                """
                DELETE FROM iot_telemetry_records
                WHERE tenant_id = ?
                  AND device_id IN (
                      SELECT id
                      FROM iot_devices
                      WHERE tenant_id = ?
                        AND identifier LIKE ?
                  )
                """,
                tenantId.toString(),
                tenantId.toString(),
                DEMO_IDENTIFIER_PATTERN
        );
        executeSql(
                """
                DELETE FROM iot_registers
                WHERE tenant_id = ?
                  AND device_id IN (
                      SELECT id
                      FROM iot_devices
                      WHERE tenant_id = ?
                        AND identifier LIKE ?
                  )
                """,
                tenantId.toString(),
                tenantId.toString(),
                DEMO_IDENTIFIER_PATTERN
        );
        executeSql(
                """
                DELETE FROM iot_devices
                WHERE tenant_id = ?
                  AND identifier LIKE ?
                """,
                tenantId.toString(),
                DEMO_IDENTIFIER_PATTERN
        );
    }

    @Test
    void shouldSeedAndGenerateOperationalDemoData() {
        demoProperties.setMode("demo");
        var firstSeed = demoScenarioService.ensureDemoBase();
        var secondSeed = demoScenarioService.ensureDemoBase();

        assertEquals(firstSeed.totalDevices(), secondSeed.totalDevices());
        assertEquals(firstSeed.totalRegisters(), secondSeed.totalRegisters());
        assertTrue(firstSeed.totalDevices() >= 4);
        assertTrue(firstSeed.totalRegisters() >= 18);

        for (int index = 0; index < 6; index++) {
            demoScenarioService.generateTick();
        }

        UUID tenantId = tenantRepository.findByCodeIgnoreCase("default")
                .orElseThrow()
                .getId();

        int demoDeviceCount = countRows(
                """
                SELECT COUNT(*)
                FROM iot_devices
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND identifier LIKE 'DEMO-IOT-%'
                """,
                tenantId.toString()
        );
        assertTrue(demoDeviceCount >= 4);

        long recentTelemetry = telemetryRecordRepository.countByTenantIdAndRecordedAtAfter(
                tenantId,
                Instant.now().minus(Duration.ofMinutes(5))
        );
        assertTrue(recentTelemetry >= 20);

        int demoAlarmCount = countRows(
                """
                SELECT COUNT(*)
                FROM iot_alarms a
                JOIN iot_devices d ON d.id = a.device_id
                WHERE a.tenant_id = ?
                  AND a.deleted_at IS NULL
                  AND d.identifier LIKE 'DEMO-IOT-%'
                """,
                tenantId.toString()
        );
        assertTrue(demoAlarmCount >= 1);

        int demoMaintenanceCount = countRows(
                """
                SELECT COUNT(*)
                FROM iot_maintenance
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND title LIKE 'DEMO - %'
                """,
                tenantId.toString()
        );
        assertTrue(demoMaintenanceCount >= 2);

        var dashboard = dashboardService.summary(tenantId);
        assertTrue(dashboard.totalDevices() >= 4);
        assertTrue(dashboard.telemetryPointsLast24h() >= 20);

        TenantContext.setTenantId(tenantId);
        try {
            var report = reportService.summary();
            assertTrue(report.totalDevices() >= 4);
            assertTrue(report.telemetryPointsLast24h() >= 20);
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void shouldExposePredictableTestModeForSmokeValidation() {
        demoProperties.setMode("test");
        demoScenarioService.ensureDemoBase();

        var firstTick = demoScenarioService.generateTick();
        var secondTick = demoScenarioService.generateTick();
        var thirdTick = demoScenarioService.generateTick();
        var fourthTick = demoScenarioService.generateTick();
        var fifthTick = demoScenarioService.generateTick();

        assertEquals("test", firstTick.mode());
        assertEquals("test", secondTick.mode());
        assertEquals(0, secondTick.anomalySignals());
        assertTrue(thirdTick.anomalySignals() >= 1);
        assertTrue(fourthTick.anomalySignals() >= 1);
        assertTrue(fifthTick.anomalySignals() >= 1);
        assertTrue(fifthTick.telemetryPoints() > 0);

        UUID tenantId = defaultTenantId();

        int testModeTelemetry = countRows(
                """
                SELECT COUNT(*)
                FROM iot_telemetry_records t
                JOIN iot_devices d ON d.id = t.device_id
                WHERE t.tenant_id = ?
                  AND d.identifier LIKE 'DEMO-IOT-%'
                  AND t.metadata LIKE '%"simulatorMode":"test"%'
                """,
                tenantId.toString()
        );
        assertTrue(testModeTelemetry >= 10);

        int deterministicAlarms = countRows(
                """
                SELECT COUNT(*)
                FROM iot_alarms a
                JOIN iot_devices d ON d.id = a.device_id
                WHERE a.tenant_id = ?
                  AND d.identifier LIKE 'DEMO-IOT-%'
                  AND a.deleted_at IS NULL
                """,
                tenantId.toString()
        );
        assertTrue(deterministicAlarms >= 1);
    }

    private UUID defaultTenantId() {
        return tenantRepository.findByCodeIgnoreCase("default")
                .orElseThrow()
                .getId();
    }
}
