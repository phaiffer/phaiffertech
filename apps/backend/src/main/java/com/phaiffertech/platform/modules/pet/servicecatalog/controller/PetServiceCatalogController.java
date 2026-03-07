package com.phaiffertech.platform.modules.pet.servicecatalog.controller;

import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogCreateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogUpdateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.service.PetServiceCatalogService;
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
@RequestMapping("/api/v1/pet/services")
public class PetServiceCatalogController {

    private final PetServiceCatalogService service;

    public PetServiceCatalogController(PetServiceCatalogService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.service.read")
    public ApiResponse<PageResponseDto<PetServiceCatalogResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.service.read")
    public ApiResponse<PetServiceCatalogResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.service.create")
    public ApiResponse<PetServiceCatalogResponse> create(@Valid @RequestBody PetServiceCatalogCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.service.update")
    public ApiResponse<PetServiceCatalogResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetServiceCatalogUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.service.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.service.delete")
    public ApiResponse<PetServiceCatalogResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
