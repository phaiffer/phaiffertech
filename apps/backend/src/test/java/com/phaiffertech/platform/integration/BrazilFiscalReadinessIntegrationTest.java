package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BrazilFiscalReadinessIntegrationTest extends AbstractIntegrationTest {

    @Test
    void fiscalProfileIsContractDrivenAndDoesNotBreakInvoiceFlow() {
        AuthSession session = createTenantAdminSession("fiscal-contract", "fiscal-contract@local.test");
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> profileResponse = put("/finance/fiscal-profile", Map.of(
                "enabled", true,
                "environment", "SANDBOX",
                "providerCode", "NOOP",
                "issuerLegalName", "Phaiffer Fiscal " + marker,
                "issuerTradeName", "Phaiffer " + marker,
                "issuerDocumentType", "CNPJ",
                "issuerDocumentNumber", "12345678000195",
                "issuerTaxRegimeCode", "SIMPLES_NACIONAL",
                "issuerCityCode", "3550308",
                "issuerCountryCode", "BR"
        ), session);

        assertEquals(200, profileResponse.getStatusCode().value());
        JsonNode profileData = requireBody(profileResponse).path("data");
        assertEquals(false, profileData.path("contractEnabled").asBoolean());
        assertEquals(true, profileData.path("profileReady").asBoolean());

        ResponseEntity<JsonNode> createInvoiceResponse = post("/finance/invoices", Map.of(
                "counterpartyName", "Customer " + marker,
                "totalAmount", 420.00,
                "status", "ISSUED",
                "issuedAt", Instant.now().toString(),
                "documentSeries", "RPS",
                "fiscalDocumentType", "NFS_E",
                "description", "Fiscal readiness " + marker
        ), session);

        assertEquals(200, createInvoiceResponse.getStatusCode().value());
        String invoiceId = requireBody(createInvoiceResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> readinessResponse = get("/finance/invoices/" + invoiceId + "/fiscal-readiness", session);
        assertEquals(200, readinessResponse.getStatusCode().value());

        JsonNode readinessData = requireBody(readinessResponse).path("data");
        assertEquals(false, readinessData.path("tenantFiscalEnabled").asBoolean());
        assertEquals(true, readinessData.path("profileConfigured").asBoolean());
        assertEquals(true, readinessData.path("profileReady").asBoolean());
        assertEquals(true, readinessData.path("invoiceDataReady").asBoolean());
        assertEquals("NOOP", readinessData.path("providerCode").asText());
        assertEquals(false, readinessData.path("providerImplemented").asBoolean());
        assertEquals(false, readinessData.path("emissionReady").asBoolean());
        assertTrue(readinessData.path("missingFields").toString().contains("tenant_fiscal_entitlement"));
    }

    @Test
    void invoiceCapturesFiscalSnapshotFromTenantProfile() {
        AuthSession session = createTenantAdminSession("fiscal-snapshot", "fiscal-snapshot@local.test");
        upsertTenantEntitlement(session.tenantId(), TenantEntitlementKeys.FINANCE_FISCAL, "MANUAL");
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> profileResponse = put("/finance/fiscal-profile", Map.ofEntries(
                Map.entry("enabled", true),
                Map.entry("environment", "SANDBOX"),
                Map.entry("providerCode", "NOOP"),
                Map.entry("issuerLegalName", "Issuer " + marker),
                Map.entry("issuerTradeName", "Issuer Trade " + marker),
                Map.entry("issuerDocumentType", "CNPJ"),
                Map.entry("issuerDocumentNumber", "99887766000144"),
                Map.entry("issuerStateRegistration", "ISENTO"),
                Map.entry("issuerMunicipalRegistration", "12345"),
                Map.entry("issuerTaxRegimeCode", "SIMPLES_NACIONAL"),
                Map.entry("issuerCityCode", "3550308"),
                Map.entry("issuerCountryCode", "BR")
        ), session);

        assertEquals(200, profileResponse.getStatusCode().value());

        ResponseEntity<JsonNode> createInvoiceResponse = post("/finance/invoices", Map.of(
                "counterpartyName", "Recipient " + marker,
                "totalAmount", 99.90,
                "status", "ISSUED",
                "issuedAt", Instant.now().toString(),
                "documentSeries", "RPS",
                "fiscalDocumentType", "NFS_E"
        ), session);

        assertEquals(200, createInvoiceResponse.getStatusCode().value());
        JsonNode invoiceData = requireBody(createInvoiceResponse).path("data");
        String invoiceId = invoiceData.path("id").asText();

        assertEquals("NOOP", invoiceData.path("fiscalProviderCode").asText());
        assertEquals("Issuer " + marker, invoiceData.path("issuerLegalName").asText());
        assertEquals("CNPJ", invoiceData.path("issuerDocumentType").asText());
        assertEquals("99887766000144", invoiceData.path("issuerDocumentNumber").asText());
        assertEquals("SIMPLES_NACIONAL", invoiceData.path("issuerTaxRegimeCode").asText());
        assertEquals("Recipient " + marker, invoiceData.path("recipientLegalName").asText());

        ResponseEntity<JsonNode> readinessResponse = get("/finance/invoices/" + invoiceId + "/fiscal-readiness", session);
        assertEquals(200, readinessResponse.getStatusCode().value());
        JsonNode readinessData = requireBody(readinessResponse).path("data");
        assertEquals(true, readinessData.path("tenantFiscalEnabled").asBoolean());
        assertEquals(true, readinessData.path("profileReady").asBoolean());
        assertEquals(true, readinessData.path("invoiceDataReady").asBoolean());
        assertEquals("NOOP", readinessData.path("providerCode").asText());
    }
}
