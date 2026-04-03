package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.infrastructure.demo.DemoCommercialEnvironmentService;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}
