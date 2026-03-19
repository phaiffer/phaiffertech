package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.finance.domain.FinanceCashCategory;
import com.phaiffertech.platform.core.finance.domain.FinanceCashMovement;
import com.phaiffertech.platform.core.finance.domain.FinancePayment;
import com.phaiffertech.platform.core.finance.dto.FinanceCashMovementResponse;
import com.phaiffertech.platform.core.finance.repository.FinanceCashMovementRepository;
import com.phaiffertech.platform.core.finance.repository.FinancePaymentRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinanceCashMovementService {

    private static final String DEFAULT_CURRENCY = "BRL";

    private final FinanceCashMovementRepository repository;
    private final FinanceInvoiceService invoiceService;
    private final FinancePaymentRepository paymentRepository;

    public FinanceCashMovementService(
            FinanceCashMovementRepository repository,
            FinanceInvoiceService invoiceService,
            FinancePaymentRepository paymentRepository
    ) {
        this.repository = repository;
        this.invoiceService = invoiceService;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "finance_cash_movement")
    public FinanceCashMovement createManual(UUID tenantId, FinanceCashMovementCreateCommand command) {
        if (!FinanceCashCategory.MANUAL_ADJUSTMENT.equals(command.category())) {
            throw new IllegalArgumentException("Manual cash movement API only accepts MANUAL_ADJUSTMENT category.");
        }
        return createInternal(tenantId, command);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "finance_cash_movement")
    public FinanceCashMovement createInternal(UUID tenantId, FinanceCashMovementCreateCommand command) {
        validateCommand(command);

        UUID resolvedInvoiceId = command.invoiceId();
        if (command.paymentId() != null) {
            FinancePayment payment = paymentRepository.findByIdAndTenantId(command.paymentId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Finance payment not found."));
            if (resolvedInvoiceId != null && !resolvedInvoiceId.equals(payment.getInvoiceId())) {
                throw new IllegalArgumentException("Cash movement invoice must match the selected payment.");
            }
            resolvedInvoiceId = payment.getInvoiceId();
        }

        if (resolvedInvoiceId != null) {
            invoiceService.getOrThrow(resolvedInvoiceId, tenantId);
        }

        FinanceCashMovement movement = new FinanceCashMovement();
        movement.setTenantId(tenantId);
        movement.setInvoiceId(resolvedInvoiceId);
        movement.setPaymentId(command.paymentId());
        movement.setDirection(command.direction());
        movement.setCategory(command.category());
        movement.setAmount(command.amount());
        movement.setCurrency(normalizeCurrency(command.currency()));
        movement.setOccurredAt(command.occurredAt() == null ? Instant.now() : command.occurredAt());
        movement.setDescription(command.description().trim());
        return repository.save(movement);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<FinanceCashMovementResponse> listCurrentTenant(
            PageRequestDto pageRequest,
            UUID invoiceId,
            UUID paymentId,
            String direction,
            String category
    ) {
        UUID tenantId = invoiceService.currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "occurredAt"));
        Page<FinanceCashMovement> movements = repository.findAllByTenantIdAndSearch(
                tenantId,
                invoiceId,
                paymentId,
                direction == null || direction.isBlank() ? null : com.phaiffertech.platform.core.finance.domain.FinanceCashDirection.valueOf(direction.trim().toUpperCase()),
                category == null || category.isBlank() ? null : FinanceCashCategory.valueOf(category.trim().toUpperCase()),
                query.search(),
                query.pageable()
        );
        return PaginationUtils.fromPage(movements.map(FinanceCashMovementResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public FinanceCashMovement getCurrentTenantOrThrow(UUID movementId) {
        return getOrThrow(movementId, invoiceService.currentTenantId());
    }

    @Transactional(readOnly = true)
    public FinanceCashMovement getOrThrow(UUID movementId, UUID tenantId) {
        return repository.findByIdAndTenantId(movementId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance cash movement not found."));
    }

    private void validateCommand(FinanceCashMovementCreateCommand command) {
        if (command.direction() == null) {
            throw new IllegalArgumentException("Cash movement direction is required.");
        }
        if (command.category() == null) {
            throw new IllegalArgumentException("Cash movement category is required.");
        }
        if (command.amount() == null || command.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Cash movement amount must be positive.");
        }
        if (command.description() == null || command.description().isBlank()) {
            throw new IllegalArgumentException("Cash movement description is required.");
        }
    }

    private String normalizeCurrency(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT_CURRENCY;
        }
        return value.trim().toUpperCase();
    }
}
