package com.phaiffertech.platform.modules.pet.product.controller;

import com.phaiffertech.platform.modules.pet.product.dto.PetProductCreateRequest;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductResponse;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductUpdateRequest;
import com.phaiffertech.platform.modules.pet.product.service.PetProductService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/products")
public class PetProductController {

    private final PetProductService service;

    public PetProductController(PetProductService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.product.read")
    public ApiResponse<PageResponseDto<PetProductResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.product.read")
    public ApiResponse<PetProductResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.product.create")
    public ApiResponse<PetProductResponse> create(@Valid @RequestBody PetProductCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.product.update")
    public ApiResponse<PetProductResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetProductUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.product.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.product.delete")
    public ApiResponse<PetProductResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
