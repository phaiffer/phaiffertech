package com.phaiffertech.platform.core.finance.controller;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.domain.FinanceSourceModule;
import com.phaiffertech.platform.core.finance.dto.FinanceInvoiceCreateRequest;
import com.phaiffertech.platform.core.finance.dto.FinanceInvoiceResponse;
import com.phaiffertech.platform.core.finance.dto.FinanceInvoiceUpdateRequest;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceService;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceUpsertCommand;
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
@RequestMapping("/api/v1/finance/invoices")
public class FinanceInvoiceController {

    private final FinanceInvoiceService service;

    public FinanceInvoiceController(FinanceInvoiceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.invoice.read")
    public ApiResponse<PageResponseDto<FinanceInvoiceResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String sourceModule,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String businessContextType,
            @RequestParam(required = false) UUID businessContextId
    ) {
        return ApiResponse.success(service.listCurrentTenant(pageRequest, sourceModule, status, businessContextType, businessContextId));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.invoice.read")
    public ApiResponse<FinanceInvoiceResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(FinanceInvoiceResponse.fromEntity(service.getCurrentTenantOrThrow(id)));
    }

    @PostMapping
    @RequirePermission("finance.invoice.create")
    public ApiResponse<FinanceInvoiceResponse> create(@Valid @RequestBody FinanceInvoiceCreateRequest request) {
        return ApiResponse.success(FinanceInvoiceResponse.fromEntity(
                service.create(service.currentTenantId(), toCommand(request))
        ));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.invoice.update")
    public ApiResponse<FinanceInvoiceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody FinanceInvoiceUpdateRequest request
    ) {
        return ApiResponse.success(FinanceInvoiceResponse.fromEntity(
                service.update(service.currentTenantId(), id, toCommand(request))
        ));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.invoice.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.softDelete(service.currentTenantId(), id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("finance.invoice.delete")
    public ApiResponse<FinanceInvoiceResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(FinanceInvoiceResponse.fromEntity(
                service.restore(service.currentTenantId(), id)
        ));
    }

    private FinanceInvoiceUpsertCommand toCommand(FinanceInvoiceCreateRequest request) {
        return new FinanceInvoiceUpsertCommand(
                request.sourceModule() == null || request.sourceModule().isBlank() ? null : FinanceSourceModule.valueOf(request.sourceModule().trim().toUpperCase()),
                request.counterpartyReferenceType(),
                request.counterpartyReferenceId(),
                request.counterpartyName(),
                request.businessContextType(),
                request.businessContextId(),
                request.description(),
                request.status() == null || request.status().isBlank() ? null : FinanceInvoiceStatus.valueOf(request.status().trim().toUpperCase()),
                request.currency(),
                request.totalAmount(),
                request.issuedAt(),
                request.dueAt(),
                request.documentSeries(),
                request.documentNumber(),
                request.fiscalDocumentType()
        );
    }

    private FinanceInvoiceUpsertCommand toCommand(FinanceInvoiceUpdateRequest request) {
        return new FinanceInvoiceUpsertCommand(
                request.sourceModule() == null || request.sourceModule().isBlank() ? null : FinanceSourceModule.valueOf(request.sourceModule().trim().toUpperCase()),
                request.counterpartyReferenceType(),
                request.counterpartyReferenceId(),
                request.counterpartyName(),
                request.businessContextType(),
                request.businessContextId(),
                request.description(),
                request.status() == null || request.status().isBlank() ? null : FinanceInvoiceStatus.valueOf(request.status().trim().toUpperCase()),
                request.currency(),
                request.totalAmount(),
                request.issuedAt(),
                request.dueAt(),
                request.documentSeries(),
                request.documentNumber(),
                request.fiscalDocumentType()
        );
    }
}
