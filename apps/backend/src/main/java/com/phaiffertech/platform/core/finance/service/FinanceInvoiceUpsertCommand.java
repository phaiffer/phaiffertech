package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.domain.FinanceSourceModule;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinanceInvoiceUpsertCommand(
        FinanceSourceModule sourceModule,
        String counterpartyReferenceType,
        UUID counterpartyReferenceId,
        String counterpartyName,
        String businessContextType,
        UUID businessContextId,
        String description,
        FinanceInvoiceStatus status,
        String currency,
        BigDecimal totalAmount,
        Instant issuedAt,
        Instant dueAt,
        String documentSeries,
        String documentNumber,
        String fiscalDocumentType
) {
}
