package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.finance.domain.FinanceCashCategory;
import com.phaiffertech.platform.core.finance.domain.FinanceCashDirection;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.domain.FinancePayment;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentMethod;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus;
import com.phaiffertech.platform.core.finance.dto.FinancePaymentResponse;
import com.phaiffertech.platform.core.finance.repository.FinancePaymentRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
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
public class FinancePaymentService {

    private final FinancePaymentRepository repository;
    private final FinanceInvoiceService invoiceService;
    private final FinanceCashMovementService cashMovementService;

    public FinancePaymentService(
            FinancePaymentRepository repository,
            FinanceInvoiceService invoiceService,
            FinanceCashMovementService cashMovementService
    ) {
        this.repository = repository;
        this.invoiceService = invoiceService;
        this.cashMovementService = cashMovementService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "finance_payment")
    public FinancePayment create(UUID tenantId, FinancePaymentUpsertCommand command) {
        validateCreate(command);

        FinanceInvoice invoice = invoiceService.getLockedOrThrow(command.invoiceId(), tenantId);
        ensureInvoiceAcceptsPayment(invoice);
        ensureConfirmedAmountFits(tenantId, invoice, command.amount(), command.status());

        FinancePayment payment = new FinancePayment();
        payment.setTenantId(tenantId);
        payment.setInvoiceId(invoice.getId());
        payment.setStatus(command.status() == null ? FinancePaymentStatus.CONFIRMED : command.status());
        payment.setMethod(command.method() == null ? FinancePaymentMethod.MANUAL : command.method());
        payment.setAmount(command.amount());
        payment.setReceivedAt(command.receivedAt() == null ? Instant.now() : command.receivedAt());
        payment.setReferenceCode(normalizeOptionalText(command.referenceCode()));
        payment.setNotes(normalizeOptionalText(command.notes()));

        FinancePayment saved = repository.save(payment);
        if (FinancePaymentStatus.CONFIRMED.equals(saved.getStatus())) {
            cashMovementService.createInternal(
                    tenantId,
                    new FinanceCashMovementCreateCommand(
                            invoice.getId(),
                            saved.getId(),
                            FinanceCashDirection.IN,
                            FinanceCashCategory.INVOICE_PAYMENT,
                            saved.getAmount(),
                            invoice.getCurrency(),
                            saved.getReceivedAt(),
                            "Invoice payment confirmed."
                    )
            );
        }
        invoiceService.reconcileInvoiceState(tenantId, invoice.getId());
        return getOrThrow(saved.getId(), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "finance_payment")
    public FinancePayment update(UUID tenantId, UUID paymentId, FinancePaymentUpsertCommand command) {
        FinancePayment payment = getOrThrow(paymentId, tenantId);
        if (!payment.getInvoiceId().equals(command.invoiceId())) {
            throw new IllegalArgumentException("Payment invoice cannot be changed.");
        }

        FinanceInvoice invoice = invoiceService.getLockedOrThrow(payment.getInvoiceId(), tenantId);
        FinancePaymentStatus requestedStatus = command.status() == null ? payment.getStatus() : command.status();

        if (FinancePaymentStatus.CONFIRMED.equals(payment.getStatus())) {
            if (!FinancePaymentStatus.CANCELED.equals(requestedStatus)) {
                throw new ConflictOperationException("Confirmed payments can only be canceled.");
            }
            payment.setStatus(FinancePaymentStatus.CANCELED);
            payment.setNotes(normalizeOptionalText(command.notes()));
            repository.save(payment);
            cashMovementService.createInternal(
                    tenantId,
                    new FinanceCashMovementCreateCommand(
                            invoice.getId(),
                            payment.getId(),
                            FinanceCashDirection.OUT,
                            FinanceCashCategory.PAYMENT_REVERSAL,
                            payment.getAmount(),
                            invoice.getCurrency(),
                            Instant.now(),
                            "Confirmed payment canceled and reversed."
                    )
            );
            invoiceService.reconcileInvoiceState(tenantId, invoice.getId());
            return getOrThrow(paymentId, tenantId);
        }

        if (FinancePaymentStatus.CANCELED.equals(payment.getStatus())) {
            throw new ConflictOperationException("Canceled payments cannot be edited.");
        }

        ensureInvoiceAcceptsPayment(invoice);
        ensureConfirmedAmountFits(
                tenantId,
                invoice,
                command.amount(),
                requestedStatus
        );

        payment.setStatus(requestedStatus);
        payment.setMethod(command.method() == null ? FinancePaymentMethod.MANUAL : command.method());
        payment.setAmount(command.amount());
        payment.setReceivedAt(command.receivedAt() == null ? payment.getReceivedAt() : command.receivedAt());
        payment.setReferenceCode(normalizeOptionalText(command.referenceCode()));
        payment.setNotes(normalizeOptionalText(command.notes()));

        FinancePayment saved = repository.save(payment);
        if (FinancePaymentStatus.CONFIRMED.equals(saved.getStatus())) {
            cashMovementService.createInternal(
                    tenantId,
                    new FinanceCashMovementCreateCommand(
                            invoice.getId(),
                            saved.getId(),
                            FinanceCashDirection.IN,
                            FinanceCashCategory.INVOICE_PAYMENT,
                            saved.getAmount(),
                            invoice.getCurrency(),
                            saved.getReceivedAt(),
                            "Pending payment confirmed."
                    )
            );
        }
        invoiceService.reconcileInvoiceState(tenantId, invoice.getId());
        return getOrThrow(saved.getId(), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "finance_payment")
    public void softDelete(UUID tenantId, UUID paymentId) {
        FinancePayment payment = getOrThrow(paymentId, tenantId);
        if (FinancePaymentStatus.CONFIRMED.equals(payment.getStatus())) {
            throw new ConflictOperationException("Confirmed payments cannot be deleted.");
        }
        payment.setDeletedAt(Instant.now());
        repository.save(payment);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "finance_payment")
    public FinancePayment restore(UUID tenantId, UUID paymentId) {
        FinancePayment payment = repository.findByIdIncludingDeleted(paymentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance payment not found."));
        if (FinancePaymentStatus.CONFIRMED.equals(payment.getStatus())) {
            throw new ConflictOperationException("Confirmed payments cannot be restored through soft delete flow.");
        }
        payment.setDeletedAt(null);
        return repository.save(payment);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<FinancePaymentResponse> listCurrentTenant(
            PageRequestDto pageRequest,
            UUID invoiceId,
            String status
    ) {
        UUID tenantId = invoiceService.currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "receivedAt"));
        Page<FinancePayment> payments = repository.findAllByTenantIdAndSearch(
                tenantId,
                invoiceId,
                status == null || status.isBlank() ? null : FinancePaymentStatus.valueOf(status.trim().toUpperCase()),
                query.search(),
                query.pageable()
        );
        return PaginationUtils.fromPage(payments.map(FinancePaymentResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public FinancePayment getCurrentTenantOrThrow(UUID paymentId) {
        return getOrThrow(paymentId, invoiceService.currentTenantId());
    }

    @Transactional(readOnly = true)
    public FinancePayment getOrThrow(UUID paymentId, UUID tenantId) {
        return repository.findByIdAndTenantId(paymentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance payment not found."));
    }

    @Transactional(readOnly = true)
    public List<FinancePayment> getByInvoiceIds(UUID tenantId, Collection<UUID> invoiceIds) {
        if (invoiceIds == null || invoiceIds.isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findAllByTenantIdAndInvoiceIdInOrderByReceivedAtDesc(tenantId, invoiceIds);
    }

    private void validateCreate(FinancePaymentUpsertCommand command) {
        if (command.invoiceId() == null) {
            throw new IllegalArgumentException("Invoice id is required.");
        }
        if (command.amount() == null || command.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive.");
        }
        if (FinancePaymentStatus.CANCELED.equals(command.status())) {
            throw new IllegalArgumentException("Payments cannot be created already canceled.");
        }
    }

    private void ensureInvoiceAcceptsPayment(FinanceInvoice invoice) {
        if (FinanceInvoiceStatus.CANCELED.equals(invoice.getStatus())) {
            throw new ConflictOperationException("Canceled invoices cannot receive payments.");
        }
    }

    private void ensureConfirmedAmountFits(
            UUID tenantId,
            FinanceInvoice invoice,
            BigDecimal amount,
            FinancePaymentStatus targetStatus
    ) {
        if (!FinancePaymentStatus.CONFIRMED.equals(targetStatus)) {
            return;
        }

        BigDecimal currentPaid = repository.sumConfirmedAmountByInvoiceId(tenantId, invoice.getId());
        BigDecimal nextPaid = (currentPaid == null ? BigDecimal.ZERO : currentPaid).add(amount);
        if (nextPaid.compareTo(invoice.getTotalAmount()) > 0) {
            throw new ConflictOperationException("Confirmed payments cannot exceed the invoice total.");
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
