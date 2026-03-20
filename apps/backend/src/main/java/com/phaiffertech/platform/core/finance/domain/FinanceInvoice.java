package com.phaiffertech.platform.core.finance.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "finance_invoices")
@SQLDelete(sql = "UPDATE finance_invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class FinanceInvoice extends BaseTenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "source_module", nullable = false, length = 20)
    private FinanceSourceModule sourceModule = FinanceSourceModule.MANUAL;

    @Column(name = "counterparty_reference_type", length = 60)
    private String counterpartyReferenceType;

    @Column(name = "counterparty_reference_id")
    private UUID counterpartyReferenceId;

    @Column(name = "counterparty_name", nullable = false, length = 160)
    private String counterpartyName;

    @Column(name = "business_context_type", length = 60)
    private String businessContextType;

    @Column(name = "business_context_id")
    private UUID businessContextId;

    @Column(name = "business_context_label", length = 180)
    private String businessContextLabel;

    @Column(name = "description", length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private FinanceInvoiceStatus status = FinanceInvoiceStatus.DRAFT;

    @Column(name = "currency", nullable = false, length = 8)
    private String currency = "BRL";

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "issued_at")
    private Instant issuedAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "canceled_at")
    private Instant canceledAt;

    @Column(name = "document_series", length = 20)
    private String documentSeries;

    @Column(name = "document_number", length = 60)
    private String documentNumber;

    @Column(name = "fiscal_document_type", length = 40)
    private String fiscalDocumentType;

    @Column(name = "fiscal_status", nullable = false, length = 40)
    private String fiscalStatus = "NOT_REQUESTED";

    @Column(name = "fiscal_reference", length = 120)
    private String fiscalReference;

    @Column(name = "fiscal_payload_reference", length = 120)
    private String fiscalPayloadReference;

    @Column(name = "fiscal_provider_code", length = 40)
    private String fiscalProviderCode;

    @Column(name = "issuer_legal_name", length = 160)
    private String issuerLegalName;

    @Column(name = "issuer_document_type", length = 20)
    private String issuerDocumentType;

    @Column(name = "issuer_document_number", length = 32)
    private String issuerDocumentNumber;

    @Column(name = "issuer_state_registration", length = 40)
    private String issuerStateRegistration;

    @Column(name = "issuer_municipal_registration", length = 40)
    private String issuerMunicipalRegistration;

    @Column(name = "issuer_tax_regime_code", length = 40)
    private String issuerTaxRegimeCode;

    @Column(name = "recipient_legal_name", length = 160)
    private String recipientLegalName;

    @Column(name = "recipient_document_type", length = 20)
    private String recipientDocumentType;

    @Column(name = "recipient_document_number", length = 32)
    private String recipientDocumentNumber;

    @Column(name = "recipient_state_registration", length = 40)
    private String recipientStateRegistration;

    @Column(name = "recipient_municipal_registration", length = 40)
    private String recipientMunicipalRegistration;

    @Column(name = "recipient_email", length = 160)
    private String recipientEmail;

    public FinanceSourceModule getSourceModule() {
        return sourceModule;
    }

    public void setSourceModule(FinanceSourceModule sourceModule) {
        this.sourceModule = sourceModule;
    }

    public String getCounterpartyReferenceType() {
        return counterpartyReferenceType;
    }

    public void setCounterpartyReferenceType(String counterpartyReferenceType) {
        this.counterpartyReferenceType = counterpartyReferenceType;
    }

    public UUID getCounterpartyReferenceId() {
        return counterpartyReferenceId;
    }

    public void setCounterpartyReferenceId(UUID counterpartyReferenceId) {
        this.counterpartyReferenceId = counterpartyReferenceId;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public String getBusinessContextType() {
        return businessContextType;
    }

    public void setBusinessContextType(String businessContextType) {
        this.businessContextType = businessContextType;
    }

    public UUID getBusinessContextId() {
        return businessContextId;
    }

    public void setBusinessContextId(UUID businessContextId) {
        this.businessContextId = businessContextId;
    }

    public String getBusinessContextLabel() {
        return businessContextLabel;
    }

    public void setBusinessContextLabel(String businessContextLabel) {
        this.businessContextLabel = businessContextLabel;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public FinanceInvoiceStatus getStatus() {
        return status;
    }

    public void setStatus(FinanceInvoiceStatus status) {
        this.status = status;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(Instant issuedAt) {
        this.issuedAt = issuedAt;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public Instant getCanceledAt() {
        return canceledAt;
    }

    public void setCanceledAt(Instant canceledAt) {
        this.canceledAt = canceledAt;
    }

    public String getDocumentSeries() {
        return documentSeries;
    }

    public void setDocumentSeries(String documentSeries) {
        this.documentSeries = documentSeries;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

    public String getFiscalDocumentType() {
        return fiscalDocumentType;
    }

    public void setFiscalDocumentType(String fiscalDocumentType) {
        this.fiscalDocumentType = fiscalDocumentType;
    }

    public String getFiscalStatus() {
        return fiscalStatus;
    }

    public void setFiscalStatus(String fiscalStatus) {
        this.fiscalStatus = fiscalStatus;
    }

    public String getFiscalReference() {
        return fiscalReference;
    }

    public void setFiscalReference(String fiscalReference) {
        this.fiscalReference = fiscalReference;
    }

    public String getFiscalPayloadReference() {
        return fiscalPayloadReference;
    }

    public void setFiscalPayloadReference(String fiscalPayloadReference) {
        this.fiscalPayloadReference = fiscalPayloadReference;
    }

    public String getFiscalProviderCode() {
        return fiscalProviderCode;
    }

    public void setFiscalProviderCode(String fiscalProviderCode) {
        this.fiscalProviderCode = fiscalProviderCode;
    }

    public String getIssuerLegalName() {
        return issuerLegalName;
    }

    public void setIssuerLegalName(String issuerLegalName) {
        this.issuerLegalName = issuerLegalName;
    }

    public String getIssuerDocumentType() {
        return issuerDocumentType;
    }

    public void setIssuerDocumentType(String issuerDocumentType) {
        this.issuerDocumentType = issuerDocumentType;
    }

    public String getIssuerDocumentNumber() {
        return issuerDocumentNumber;
    }

    public void setIssuerDocumentNumber(String issuerDocumentNumber) {
        this.issuerDocumentNumber = issuerDocumentNumber;
    }

    public String getIssuerStateRegistration() {
        return issuerStateRegistration;
    }

    public void setIssuerStateRegistration(String issuerStateRegistration) {
        this.issuerStateRegistration = issuerStateRegistration;
    }

    public String getIssuerMunicipalRegistration() {
        return issuerMunicipalRegistration;
    }

    public void setIssuerMunicipalRegistration(String issuerMunicipalRegistration) {
        this.issuerMunicipalRegistration = issuerMunicipalRegistration;
    }

    public String getIssuerTaxRegimeCode() {
        return issuerTaxRegimeCode;
    }

    public void setIssuerTaxRegimeCode(String issuerTaxRegimeCode) {
        this.issuerTaxRegimeCode = issuerTaxRegimeCode;
    }

    public String getRecipientLegalName() {
        return recipientLegalName;
    }

    public void setRecipientLegalName(String recipientLegalName) {
        this.recipientLegalName = recipientLegalName;
    }

    public String getRecipientDocumentType() {
        return recipientDocumentType;
    }

    public void setRecipientDocumentType(String recipientDocumentType) {
        this.recipientDocumentType = recipientDocumentType;
    }

    public String getRecipientDocumentNumber() {
        return recipientDocumentNumber;
    }

    public void setRecipientDocumentNumber(String recipientDocumentNumber) {
        this.recipientDocumentNumber = recipientDocumentNumber;
    }

    public String getRecipientStateRegistration() {
        return recipientStateRegistration;
    }

    public void setRecipientStateRegistration(String recipientStateRegistration) {
        this.recipientStateRegistration = recipientStateRegistration;
    }

    public String getRecipientMunicipalRegistration() {
        return recipientMunicipalRegistration;
    }

    public void setRecipientMunicipalRegistration(String recipientMunicipalRegistration) {
        this.recipientMunicipalRegistration = recipientMunicipalRegistration;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
}
