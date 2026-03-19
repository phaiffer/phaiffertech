package com.phaiffertech.platform.core.finance.controller;

import com.phaiffertech.platform.core.finance.domain.FinanceCashCategory;
import com.phaiffertech.platform.core.finance.domain.FinanceCashDirection;
import com.phaiffertech.platform.core.finance.dto.FinanceCashMovementCreateRequest;
import com.phaiffertech.platform.core.finance.dto.FinanceCashMovementResponse;
import com.phaiffertech.platform.core.finance.service.FinanceCashMovementCreateCommand;
import com.phaiffertech.platform.core.finance.service.FinanceCashMovementService;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance/cash-movements")
public class FinanceCashMovementController {

    private final FinanceCashMovementService service;
    private final FinanceInvoiceService invoiceService;

    public FinanceCashMovementController(
            FinanceCashMovementService service,
            FinanceInvoiceService invoiceService
    ) {
        this.service = service;
        this.invoiceService = invoiceService;
    }

    @GetMapping
    @RequirePermission("finance.cash.read")
    public ApiResponse<PageResponseDto<FinanceCashMovementResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID invoiceId,
            @RequestParam(required = false) UUID paymentId,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String category
    ) {
        return ApiResponse.success(service.listCurrentTenant(pageRequest, invoiceId, paymentId, direction, category));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.cash.read")
    public ApiResponse<FinanceCashMovementResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(FinanceCashMovementResponse.fromEntity(service.getCurrentTenantOrThrow(id)));
    }

    @PostMapping
    @RequirePermission("finance.cash.create")
    public ApiResponse<FinanceCashMovementResponse> create(@Valid @RequestBody FinanceCashMovementCreateRequest request) {
        return ApiResponse.success(FinanceCashMovementResponse.fromEntity(
                service.createManual(invoiceService.currentTenantId(), new FinanceCashMovementCreateCommand(
                        request.invoiceId(),
                        request.paymentId(),
                        FinanceCashDirection.valueOf(request.direction().trim().toUpperCase()),
                        FinanceCashCategory.valueOf(request.category().trim().toUpperCase()),
                        request.amount(),
                        request.currency(),
                        request.occurredAt(),
                        request.description()
                ))
        ));
    }
}
