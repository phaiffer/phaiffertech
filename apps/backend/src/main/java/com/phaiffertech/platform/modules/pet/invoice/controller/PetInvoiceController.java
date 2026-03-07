package com.phaiffertech.platform.modules.pet.invoice.controller;

import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceCreateRequest;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceResponse;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceUpdateRequest;
import com.phaiffertech.platform.modules.pet.invoice.service.PetInvoiceService;
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
@RequestMapping("/api/v1/pet/invoices")
public class PetInvoiceController {

    private final PetInvoiceService service;

    public PetInvoiceController(PetInvoiceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.invoice.read")
    public ApiResponse<PageResponseDto<PetInvoiceResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(service.list(pageRequest, clientId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.invoice.read")
    public ApiResponse<PetInvoiceResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.invoice.create")
    public ApiResponse<PetInvoiceResponse> create(@Valid @RequestBody PetInvoiceCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.invoice.update")
    public ApiResponse<PetInvoiceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetInvoiceUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.invoice.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.invoice.delete")
    public ApiResponse<PetInvoiceResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
