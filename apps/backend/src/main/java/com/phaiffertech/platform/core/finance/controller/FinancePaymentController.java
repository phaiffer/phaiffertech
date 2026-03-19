package com.phaiffertech.platform.core.finance.controller;

import com.phaiffertech.platform.core.finance.domain.FinancePaymentMethod;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus;
import com.phaiffertech.platform.core.finance.dto.FinancePaymentCreateRequest;
import com.phaiffertech.platform.core.finance.dto.FinancePaymentResponse;
import com.phaiffertech.platform.core.finance.dto.FinancePaymentUpdateRequest;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceService;
import com.phaiffertech.platform.core.finance.service.FinancePaymentService;
import com.phaiffertech.platform.core.finance.service.FinancePaymentUpsertCommand;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance/payments")
public class FinancePaymentController {

    private final FinancePaymentService service;
    private final FinanceInvoiceService invoiceService;

    public FinancePaymentController(
            FinancePaymentService service,
            FinanceInvoiceService invoiceService
    ) {
        this.service = service;
        this.invoiceService = invoiceService;
    }

    @GetMapping
    @RequirePermission("finance.payment.read")
    public ApiResponse<PageResponseDto<FinancePaymentResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID invoiceId,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(service.listCurrentTenant(pageRequest, invoiceId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.payment.read")
    public ApiResponse<FinancePaymentResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(FinancePaymentResponse.fromEntity(service.getCurrentTenantOrThrow(id)));
    }

    @PostMapping
    @RequirePermission("finance.payment.create")
    public ApiResponse<FinancePaymentResponse> create(@Valid @RequestBody FinancePaymentCreateRequest request) {
        return ApiResponse.success(FinancePaymentResponse.fromEntity(
                service.create(invoiceService.currentTenantId(), toCommand(request))
        ));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.payment.update")
    public ApiResponse<FinancePaymentResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody FinancePaymentUpdateRequest request
    ) {
        return ApiResponse.success(FinancePaymentResponse.fromEntity(
                service.update(invoiceService.currentTenantId(), id, toCommand(request))
        ));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.payment.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.softDelete(invoiceService.currentTenantId(), id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("finance.payment.delete")
    public ApiResponse<FinancePaymentResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(FinancePaymentResponse.fromEntity(
                service.restore(invoiceService.currentTenantId(), id)
        ));
    }

    private FinancePaymentUpsertCommand toCommand(FinancePaymentCreateRequest request) {
        return new FinancePaymentUpsertCommand(
                request.invoiceId(),
                request.status() == null || request.status().isBlank() ? null : FinancePaymentStatus.valueOf(request.status().trim().toUpperCase()),
                request.method() == null || request.method().isBlank() ? FinancePaymentMethod.MANUAL : FinancePaymentMethod.valueOf(request.method().trim().toUpperCase()),
                request.amount(),
                request.receivedAt(),
                request.referenceCode(),
                request.notes()
        );
    }

    private FinancePaymentUpsertCommand toCommand(FinancePaymentUpdateRequest request) {
        return new FinancePaymentUpsertCommand(
                request.invoiceId(),
                request.status() == null || request.status().isBlank() ? null : FinancePaymentStatus.valueOf(request.status().trim().toUpperCase()),
                request.method() == null || request.method().isBlank() ? FinancePaymentMethod.MANUAL : FinancePaymentMethod.valueOf(request.method().trim().toUpperCase()),
                request.amount(),
                request.receivedAt(),
                request.referenceCode(),
                request.notes()
        );
    }
}
