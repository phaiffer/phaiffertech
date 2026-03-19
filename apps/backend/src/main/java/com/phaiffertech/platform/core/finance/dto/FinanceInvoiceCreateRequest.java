package com.phaiffertech.platform.core.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinanceInvoiceCreateRequest(
        String sourceModule,
        String counterpartyReferenceType,
        UUID counterpartyReferenceId,
        String counterpartyName,
        String businessContextType,
        UUID businessContextId,
        String description,
        String status,
        String currency,
        @NotNull @DecimalMin("0.00") BigDecimal totalAmount,
        Instant issuedAt,
        Instant dueAt,
        String documentSeries,
        String documentNumber,
        String fiscalDocumentType
) {
}
