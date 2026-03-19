package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FinanceFoundationIntegrationTest extends AbstractIntegrationTest {

    @Test
    void petInvoiceFlowCreatesSharedInvoicePaymentAndCashMovement() {
        AuthSession session = createTenantAdminSession(
                "finance-pet",
                "finance-pet@local.test",
                "CORE_PLATFORM",
                "PET"
        );
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> clientResponse = post("/pet/clients", Map.of(
                "name", "Tutor " + marker,
                "email", "tutor." + marker + "@example.test",
                "phone", "+5511999999999",
                "document", "DOC-" + marker,
                "address", "Street " + marker,
                "status", "ACTIVE"
        ), session);
        assertEquals(200, clientResponse.getStatusCode().value());
        String clientId = requireBody(clientResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> invoiceResponse = post("/pet/invoices", Map.of(
                "clientId", clientId,
                "totalAmount", 180.00,
                "status", "ISSUED",
                "issuedAt", Instant.now().toString(),
                "dueAt", Instant.now().plusSeconds(86_400).toString(),
                "description", "Finance foundation " + marker
        ), session);

        assertEquals(200, invoiceResponse.getStatusCode().value());
        JsonNode invoiceData = requireBody(invoiceResponse).path("data");
        String petInvoiceId = invoiceData.path("id").asText();
        String financeInvoiceId = invoiceData.path("financeInvoiceId").asText();
        assertEquals("ISSUED", invoiceData.path("status").asText());
        assertEquals(0.0, invoiceData.path("paidAmount").asDouble(), 0.001);

        ResponseEntity<JsonNode> paymentResponse = post("/pet/invoices/" + petInvoiceId + "/payments", Map.of(
                "amount", 180.00,
                "method", "PIX",
                "receivedAt", Instant.now().toString(),
                "referenceCode", "PIX-" + marker,
                "notes", "Settled at the front desk"
        ), session);

        assertEquals(200, paymentResponse.getStatusCode().value());
        assertEquals("CONFIRMED", requireBody(paymentResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> refreshedInvoice = get("/pet/invoices/" + petInvoiceId, session);
        assertEquals(200, refreshedInvoice.getStatusCode().value());
        assertEquals("PAID", requireBody(refreshedInvoice).path("data").path("status").asText());
        assertEquals(1, requireBody(refreshedInvoice).path("data").path("payments").size());
        assertEquals(180.0, requireBody(refreshedInvoice).path("data").path("paidAmount").asDouble(), 0.001);

        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM finance_invoices WHERE id = ? AND tenant_id = ? AND status = 'PAID'",
                financeInvoiceId,
                session.tenantId()
        ));
        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM finance_payments WHERE invoice_id = ? AND tenant_id = ? AND status = 'CONFIRMED'",
                financeInvoiceId,
                session.tenantId()
        ));
        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM finance_cash_movements WHERE invoice_id = ? AND tenant_id = ? AND category = 'INVOICE_PAYMENT'",
                financeInvoiceId,
                session.tenantId()
        ));
    }

    @Test
    void financeInvoicesRemainTenantIsolated() {
        AuthSession tenantA = createTenantAdminSession("finance-a", "finance-a@local.test");
        AuthSession tenantB = createTenantAdminSession("finance-b", "finance-b@local.test");
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/finance/invoices", Map.of(
                "counterpartyName", "Customer " + marker,
                "totalAmount", 320.00,
                "status", "ISSUED",
                "issuedAt", Instant.now().toString(),
                "description", "Tenant scoped finance record " + marker
        ), tenantA);

        assertEquals(200, createResponse.getStatusCode().value());
        String invoiceId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> foreignRead = get("/finance/invoices/" + invoiceId, tenantB);
        assertEquals(404, foreignRead.getStatusCode().value());
        assertTrue(requireBody(foreignRead).path("message").asText().contains("Finance invoice not found"));
    }

    @Test
    void financeInvoiceRejectsInvalidBusinessContextReference() {
        AuthSession session = createTenantAdminSession("finance-context", "finance-context@local.test");

        ResponseEntity<JsonNode> response = post("/finance/invoices", Map.of(
                "counterpartyName", "Context validation customer",
                "totalAmount", 95.00,
                "status", "ISSUED",
                "issuedAt", Instant.now().toString(),
                "businessContextType", "CRM.DEAL",
                "businessContextId", "11111111-1111-1111-1111-111111111111"
        ), session);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Finance business context not found.", requireBody(response).path("message").asText());
    }
}
