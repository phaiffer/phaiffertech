package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.infrastructure.demo.DemoCommercialProperties;
import com.phaiffertech.platform.infrastructure.demo.DemoCommercialEnvironmentService;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@TestPropertySource(properties = {
        "app.demo.commercial.tenant-code=demo-commercial-seed-test",
        "app.demo.commercial.tenant-name=Demo Commercial Seed Test",
        "app.demo.commercial.user-email=demo-commercial-seed@phaiffertech.local",
        "app.demo.commercial.user-password=Demo@123",
        "app.demo.commercial.user-full-name=Demo Commercial Seed Operator"
})
class DemoCommercialEnvironmentServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private DemoCommercialEnvironmentService demoCommercialEnvironmentService;

    @Autowired
    private DemoCommercialProperties demoCommercialProperties;

    @Autowired
    private TenantRepository tenantRepository;

    @Test
    void shouldPersistTenantBeforeSeedingCommercialDemoData() {
        var firstSeed = demoCommercialEnvironmentService.seed();
        var secondSeed = demoCommercialEnvironmentService.seed();

        UUID tenantId = tenantRepository.findByCodeIgnoreCase("demo-commercial-seed-test")
                .orElseThrow()
                .getId();

        assertEquals("demo-commercial-seed-test", firstSeed.tenantCode());
        assertEquals("demo-commercial-seed@phaiffertech.local", firstSeed.userEmail());
        assertEquals("demo-commercial-seed-test", secondSeed.tenantCode());
        assertEquals("demo-commercial-seed@phaiffertech.local", secondSeed.userEmail());

        assertEquals(1, countRows("SELECT COUNT(*) FROM tenants WHERE id = ?", tenantId.toString()));
        assertEquals(3, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ? AND deleted_at IS NULL", tenantId.toString()));
        assertEquals(3, countRows("SELECT COUNT(*) FROM crm_companies WHERE tenant_id = ? AND deleted_at IS NULL", tenantId.toString()));
        assertEquals(3, countRows("SELECT COUNT(*) FROM crm_contacts WHERE tenant_id = ? AND deleted_at IS NULL", tenantId.toString()));
        assertEquals(3, countRows("SELECT COUNT(*) FROM crm_leads WHERE tenant_id = ? AND deleted_at IS NULL", tenantId.toString()));
        assertEquals(3, countRows("SELECT COUNT(*) FROM pet_profiles WHERE tenant_id = ? AND deleted_at IS NULL", tenantId.toString()));
    }

    @Test
    void shouldClearLegacyAppointmentServiceLinesBeforeReseedingCommercialDemoData() {
        demoCommercialEnvironmentService.seed();

        UUID tenantId = tenantRepository.findByCodeIgnoreCase("demo-commercial-seed-test")
                .orElseThrow()
                .getId();
        UUID appointmentId = jdbcTemplate.queryForObject("""
                SELECT a.id FROM pet_appointments a
                JOIN pet_profiles p ON p.id = a.pet_id
                WHERE a.tenant_id = ? AND p.name = 'Rex'
                """, UUID.class, tenantId);
        UUID serviceId = jdbcTemplate.queryForObject(
                "SELECT service_id FROM pet_appointments WHERE id = ?", UUID.class, appointmentId);

        executeSql(
                """
                INSERT INTO pet_appointment_services (
                    id, tenant_id, appointment_id, service_id, line_order, service_name, service_category,
                    duration_minutes, service_price, created_by, updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'test', 'test')
                """,
                UUID.randomUUID().toString(),
                tenantId.toString(),
                appointmentId,
                serviceId,
                0,
                "Vacinacao",
                "CLINICAL",
                30,
                new BigDecimal("120.00")
        );

        demoCommercialEnvironmentService.seed();

        assertEquals(0, countRows(
                "SELECT COUNT(*) FROM pet_appointment_services WHERE tenant_id = ?",
                tenantId.toString()
        ));
    }

    @Test
    void shouldSeedTwoTenantsWithDistinctStableEntityIds() {
        demoCommercialEnvironmentService.seed();
        UUID firstTenantId = tenantRepository.findByCodeIgnoreCase("demo-commercial-seed-test")
                .orElseThrow().getId();
        UUID firstCompanyId = companyId(firstTenantId);

        String originalTenantCode = demoCommercialProperties.getTenantCode();
        String originalTenantName = demoCommercialProperties.getTenantName();
        String originalUserEmail = demoCommercialProperties.getUserEmail();
        String marker = randomSearchMarker();
        UUID secondTenantId;
        UUID secondCompanyId;
        try {
            demoCommercialProperties.setTenantCode("demo-commercial-seed-" + marker);
            demoCommercialProperties.setTenantName("Second Commercial Demo " + marker);
            demoCommercialProperties.setUserEmail("demo-commercial-" + marker + "@example.test");

            demoCommercialEnvironmentService.seed();
            secondTenantId = tenantRepository.findByCodeIgnoreCase(demoCommercialProperties.getTenantCode())
                    .orElseThrow().getId();
            secondCompanyId = companyId(secondTenantId);
            assertNotEquals(firstCompanyId, secondCompanyId);

            demoCommercialEnvironmentService.seed();
            assertEquals(secondCompanyId, companyId(secondTenantId));
        } finally {
            demoCommercialProperties.setTenantCode(originalTenantCode);
            demoCommercialProperties.setTenantName(originalTenantName);
            demoCommercialProperties.setUserEmail(originalUserEmail);
        }

        demoCommercialEnvironmentService.seed();
        assertEquals(firstCompanyId, companyId(firstTenantId));
        for (UUID tenantId : new UUID[] {firstTenantId, secondTenantId}) {
            assertEquals(3, countRows("SELECT COUNT(*) FROM crm_companies WHERE tenant_id = ?", tenantId));
            assertEquals(3, countRows("""
                    SELECT COUNT(*) FROM crm_contacts c
                    JOIN crm_companies company ON company.id = c.company_id AND company.tenant_id = c.tenant_id
                    WHERE c.tenant_id = ?
                    """, tenantId));
            assertEquals(3, countRows("""
                    SELECT COUNT(*) FROM pet_profiles p
                    JOIN pet_clients client ON client.id = p.client_id AND client.tenant_id = p.tenant_id
                    WHERE p.tenant_id = ?
                    """, tenantId));
        }
    }

    private UUID companyId(UUID tenantId) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM crm_companies WHERE tenant_id = ? AND name = 'AgroTech Sul'",
                UUID.class, tenantId);
    }
}
