package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.domain.FinanceSourceModule;
import com.phaiffertech.platform.core.finance.dto.FinanceInvoiceResponse;
import com.phaiffertech.platform.core.finance.repository.FinanceInvoiceRepository;
import com.phaiffertech.platform.core.finance.repository.FinancePaymentRepository;
import com.phaiffertech.platform.shared.contracts.finance.FinanceReferenceCapability;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinanceInvoiceService {

    private static final String DEFAULT_CURRENCY = "BRL";

    private final FinanceInvoiceRepository repository;
    private final FinancePaymentRepository paymentRepository;
    private final FinanceReferenceResolverService referenceResolverService;

    public FinanceInvoiceService(
            FinanceInvoiceRepository repository,
            FinancePaymentRepository paymentRepository,
            FinanceReferenceResolverService referenceResolverService
    ) {
        this.repository = repository;
        this.paymentRepository = paymentRepository;
        this.referenceResolverService = referenceResolverService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "finance_invoice")
    public FinanceInvoice create(UUID tenantId, FinanceInvoiceUpsertCommand command) {
        FinanceInvoice invoice = new FinanceInvoice();
        invoice.setTenantId(tenantId);
        invoice.setPaidAmount(BigDecimal.ZERO);
        applyUpsert(invoice, tenantId, command, true);
        FinanceInvoice saved = repository.save(invoice);
        return reconcileInvoiceState(tenantId, saved.getId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "finance_invoice")
    public FinanceInvoice update(UUID tenantId, UUID invoiceId, FinanceInvoiceUpsertCommand command) {
        FinanceInvoice invoice = getLockedOrThrow(invoiceId, tenantId);
        applyUpsert(invoice, tenantId, command, false);
        repository.save(invoice);
        return reconcileInvoiceState(tenantId, invoiceId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "finance_invoice")
    public void softDelete(UUID tenantId, UUID invoiceId) {
        FinanceInvoice invoice = getOrThrow(invoiceId, tenantId);
        if (paymentRepository.existsByTenantIdAndInvoiceId(tenantId, invoiceId)) {
            throw new ConflictOperationException("Invoices with payments cannot be deleted.");
        }
        invoice.setDeletedAt(Instant.now());
        repository.save(invoice);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "finance_invoice")
    public FinanceInvoice restore(UUID tenantId, UUID invoiceId) {
        FinanceInvoice invoice = repository.findByIdIncludingDeleted(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance invoice not found."));
        invoice.setDeletedAt(null);
        return repository.save(invoice);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<FinanceInvoiceResponse> listCurrentTenant(
            PageRequestDto pageRequest,
            String sourceModule,
            String status,
            String businessContextType,
            UUID businessContextId
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "issuedAt"));
        Page<FinanceInvoice> invoices = repository.findAllByTenantIdAndSearch(
                tenantId,
                normalizeSourceModule(sourceModule),
                normalizeStatus(status),
                referenceResolverService.normalizeReferenceType(businessContextType),
                businessContextId,
                query.search(),
                query.pageable()
        );
        return PaginationUtils.fromPage(invoices.map(FinanceInvoiceResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public FinanceInvoice getCurrentTenantOrThrow(UUID invoiceId) {
        return getOrThrow(invoiceId, currentTenantId());
    }

    @Transactional(readOnly = true)
    public FinanceInvoice getOrThrow(UUID invoiceId, UUID tenantId) {
        return repository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance invoice not found."));
    }

    @Transactional(readOnly = true)
    public List<FinanceInvoice> getAllByIds(UUID tenantId, Collection<UUID> invoiceIds) {
        if (invoiceIds == null || invoiceIds.isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findAllByTenantIdAndIdIn(tenantId, invoiceIds);
    }

    @Transactional
    public FinanceInvoice reconcileInvoiceState(UUID tenantId, UUID invoiceId) {
        FinanceInvoice invoice = getLockedOrThrow(invoiceId, tenantId);
        BigDecimal paidAmount = normalizeAmount(paymentRepository.sumConfirmedAmountByInvoiceId(tenantId, invoiceId));
        if (paidAmount.compareTo(invoice.getTotalAmount()) > 0) {
            throw new ConflictOperationException("Confirmed payments cannot exceed the invoice total.");
        }

        invoice.setPaidAmount(paidAmount);
        Instant latestConfirmedAt = paymentRepository.findLatestConfirmedReceivedAt(tenantId, invoiceId);

        if (paidAmount.signum() > 0 && invoice.getIssuedAt() == null) {
            invoice.setIssuedAt(latestConfirmedAt == null ? Instant.now() : latestConfirmedAt);
        }

        if (paidAmount.compareTo(invoice.getTotalAmount()) == 0 && invoice.getTotalAmount().signum() > 0) {
            invoice.setStatus(FinanceInvoiceStatus.PAID);
            invoice.setPaidAt(latestConfirmedAt == null ? Instant.now() : latestConfirmedAt);
            invoice.setCanceledAt(null);
        } else if (invoice.getStatus() != FinanceInvoiceStatus.CANCELED) {
            invoice.setPaidAt(null);
            invoice.setStatus(invoice.getIssuedAt() == null ? FinanceInvoiceStatus.DRAFT : FinanceInvoiceStatus.ISSUED);
        }

        return repository.save(invoice);
    }

    @Transactional(readOnly = true)
    public FinanceInvoice getIncludingDeletedOrThrow(UUID invoiceId, UUID tenantId) {
        return repository.findByIdIncludingDeleted(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance invoice not found."));
    }

    @Transactional(readOnly = true)
    public UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }

    @Transactional
    public FinanceInvoice getLockedOrThrow(UUID invoiceId, UUID tenantId) {
        return repository.findLockedByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance invoice not found."));
    }

    private void applyUpsert(FinanceInvoice invoice, UUID tenantId, FinanceInvoiceUpsertCommand command, boolean creating) {
        BigDecimal totalAmount = normalizeAmount(command.totalAmount());
        if (invoice.getPaidAmount() != null && invoice.getPaidAmount().compareTo(totalAmount) > 0) {
            throw new ConflictOperationException("Invoice total cannot be lower than the confirmed paid amount.");
        }

        FinanceReferenceCapability.ReferenceDescriptor counterpartyDescriptor = resolveCounterparty(tenantId, command);
        FinanceReferenceCapability.ReferenceDescriptor businessContextDescriptor = resolveBusinessContext(tenantId, command);
        FinanceInvoiceStatus requestedStatus = normalizeStatus(command.status(), invoice.getStatus(), creating);

        if (FinanceInvoiceStatus.PAID.equals(requestedStatus)) {
            throw new IllegalArgumentException("Invoice status PAID must be reached through payments.");
        }

        if (FinanceInvoiceStatus.CANCELED.equals(requestedStatus)
                && invoice.getPaidAmount() != null
                && invoice.getPaidAmount().signum() > 0) {
            throw new ConflictOperationException("Paid invoices cannot be canceled.");
        }

        if (FinanceInvoiceStatus.DRAFT.equals(requestedStatus)
                && invoice.getPaidAmount() != null
                && invoice.getPaidAmount().signum() > 0) {
            throw new ConflictOperationException("Invoices with confirmed payments cannot return to draft.");
        }

        invoice.setSourceModule(command.sourceModule() == null ? FinanceSourceModule.MANUAL : command.sourceModule());
        invoice.setCounterpartyReferenceType(counterpartyDescriptor == null ? null : counterpartyDescriptor.referenceType());
        invoice.setCounterpartyReferenceId(counterpartyDescriptor == null ? null : counterpartyDescriptor.relatedId());
        invoice.setCounterpartyName(counterpartyDescriptor == null ? normalizeRequiredText(command.counterpartyName(), "Counterparty name is required.")
                : counterpartyDescriptor.displayName());
        invoice.setBusinessContextType(businessContextDescriptor == null ? null : businessContextDescriptor.referenceType());
        invoice.setBusinessContextId(businessContextDescriptor == null ? null : businessContextDescriptor.relatedId());
        invoice.setBusinessContextLabel(businessContextDescriptor == null ? null : normalizeOptionalText(
                joinNonBlank(" · ", businessContextDescriptor.displayName(), businessContextDescriptor.displayContext())
        ));
        invoice.setDescription(normalizeOptionalText(command.description()));
        invoice.setCurrency(normalizeCurrency(command.currency()));
        invoice.setTotalAmount(totalAmount);
        invoice.setDueAt(command.dueAt());
        invoice.setDocumentSeries(normalizeOptionalText(command.documentSeries()));
        invoice.setDocumentNumber(normalizeOptionalText(command.documentNumber()));
        invoice.setFiscalDocumentType(normalizeOptionalText(command.fiscalDocumentType()));

        if (FinanceInvoiceStatus.CANCELED.equals(requestedStatus)) {
            invoice.setStatus(FinanceInvoiceStatus.CANCELED);
            invoice.setCanceledAt(invoice.getCanceledAt() == null ? Instant.now() : invoice.getCanceledAt());
            invoice.setPaidAt(null);
            return;
        }

        invoice.setCanceledAt(null);
        invoice.setPaidAt(null);
        if (FinanceInvoiceStatus.ISSUED.equals(requestedStatus)) {
            invoice.setStatus(FinanceInvoiceStatus.ISSUED);
            invoice.setIssuedAt(command.issuedAt() == null ? (invoice.getIssuedAt() == null ? Instant.now() : invoice.getIssuedAt()) : command.issuedAt());
            return;
        }

        invoice.setStatus(FinanceInvoiceStatus.DRAFT);
        invoice.setIssuedAt(null);
    }

    private FinanceReferenceCapability.ReferenceDescriptor resolveCounterparty(UUID tenantId, FinanceInvoiceUpsertCommand command) {
        if (command.counterpartyReferenceType() == null && command.counterpartyReferenceId() == null) {
            if (command.counterpartyName() == null || command.counterpartyName().isBlank()) {
                throw new IllegalArgumentException("Counterparty name or reference is required.");
            }
            return null;
        }
        return referenceResolverService.requireReference(
                tenantId,
                command.counterpartyReferenceType(),
                command.counterpartyReferenceId(),
                "Counterparty reference not found."
        );
    }

    private FinanceReferenceCapability.ReferenceDescriptor resolveBusinessContext(UUID tenantId, FinanceInvoiceUpsertCommand command) {
        if (command.businessContextType() == null && command.businessContextId() == null) {
            return null;
        }
        return referenceResolverService.requireReference(
                tenantId,
                command.businessContextType(),
                command.businessContextId(),
                "Finance business context not found."
        );
    }

    private FinanceSourceModule normalizeSourceModule(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return FinanceSourceModule.valueOf(value.trim().toUpperCase());
    }

    private FinanceInvoiceStatus normalizeStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return FinanceInvoiceStatus.valueOf(value.trim().toUpperCase());
    }

    private FinanceInvoiceStatus normalizeStatus(
            FinanceInvoiceStatus value,
            FinanceInvoiceStatus currentStatus,
            boolean creating
    ) {
        if (value == null) {
            if (creating) {
                return FinanceInvoiceStatus.DRAFT;
            }
            if (FinanceInvoiceStatus.PAID.equals(currentStatus)) {
                return FinanceInvoiceStatus.ISSUED;
            }
            return currentStatus == null ? FinanceInvoiceStatus.ISSUED : currentStatus;
        }
        return value;
    }

    private BigDecimal normalizeAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.stripTrailingZeros().max(BigDecimal.ZERO);
    }

    private String normalizeCurrency(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT_CURRENCY;
        }
        return value.trim().toUpperCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeRequiredText(String value, String message) {
        String normalized = normalizeOptionalText(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String joinNonBlank(String separator, String left, String right) {
        String normalizedLeft = normalizeOptionalText(left);
        String normalizedRight = normalizeOptionalText(right);
        if (normalizedLeft == null) {
            return normalizedRight;
        }
        if (normalizedRight == null) {
            return normalizedLeft;
        }
        return normalizedLeft + separator + normalizedRight;
    }
}
