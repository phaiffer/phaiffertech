package com.phaiffertech.platform.core.finance.dto;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinanceInvoiceResponse(
        UUID id,
        String sourceModule,
        String counterpartyReferenceType,
        UUID counterpartyReferenceId,
        String counterpartyName,
        String businessContextType,
        UUID businessContextId,
        String businessContextLabel,
        String description,
        String status,
        String currency,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal outstandingAmount,
        Instant issuedAt,
        Instant dueAt,
        Instant paidAt,
        Instant canceledAt,
        String documentSeries,
        String documentNumber,
        String fiscalDocumentType,
        String fiscalStatus,
        String fiscalReference,
        String fiscalPayloadReference,
        String fiscalProviderCode,
        String issuerLegalName,
        String issuerDocumentType,
        String issuerDocumentNumber,
        String issuerStateRegistration,
        String issuerMunicipalRegistration,
        String issuerTaxRegimeCode,
        String recipientLegalName,
        String recipientDocumentType,
        String recipientDocumentNumber,
        String recipientStateRegistration,
        String recipientMunicipalRegistration,
        String recipientEmail,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinanceInvoiceResponse fromEntity(FinanceInvoice invoice) {
        BigDecimal totalAmount = invoice.getTotalAmount() == null ? BigDecimal.ZERO : invoice.getTotalAmount();
        BigDecimal paidAmount = invoice.getPaidAmount() == null ? BigDecimal.ZERO : invoice.getPaidAmount();
        return new FinanceInvoiceResponse(
                invoice.getId(),
                invoice.getSourceModule().name(),
                invoice.getCounterpartyReferenceType(),
                invoice.getCounterpartyReferenceId(),
                invoice.getCounterpartyName(),
                invoice.getBusinessContextType(),
                invoice.getBusinessContextId(),
                invoice.getBusinessContextLabel(),
                invoice.getDescription(),
                invoice.getStatus().name(),
                invoice.getCurrency(),
                totalAmount,
                paidAmount,
                totalAmount.subtract(paidAmount),
                invoice.getIssuedAt(),
                invoice.getDueAt(),
                invoice.getPaidAt(),
                invoice.getCanceledAt(),
                invoice.getDocumentSeries(),
                invoice.getDocumentNumber(),
                invoice.getFiscalDocumentType(),
                invoice.getFiscalStatus(),
                invoice.getFiscalReference(),
                invoice.getFiscalPayloadReference(),
                invoice.getFiscalProviderCode(),
                invoice.getIssuerLegalName(),
                invoice.getIssuerDocumentType(),
                invoice.getIssuerDocumentNumber(),
                invoice.getIssuerStateRegistration(),
                invoice.getIssuerMunicipalRegistration(),
                invoice.getIssuerTaxRegimeCode(),
                invoice.getRecipientLegalName(),
                invoice.getRecipientDocumentType(),
                invoice.getRecipientDocumentNumber(),
                invoice.getRecipientStateRegistration(),
                invoice.getRecipientMunicipalRegistration(),
                invoice.getRecipientEmail(),
                invoice.getCreatedAt(),
                invoice.getUpdatedAt()
        );
    }
}
