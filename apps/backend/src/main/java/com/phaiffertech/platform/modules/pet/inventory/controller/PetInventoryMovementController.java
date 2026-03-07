package com.phaiffertech.platform.modules.pet.inventory.controller;

import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementCreateRequest;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementResponse;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementUpdateRequest;
import com.phaiffertech.platform.modules.pet.inventory.service.PetInventoryMovementService;
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
@RequestMapping("/api/v1/pet/inventory")
public class PetInventoryMovementController {

    private final PetInventoryMovementService service;

    public PetInventoryMovementController(PetInventoryMovementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.inventory.read")
    public ApiResponse<PageResponseDto<PetInventoryMovementResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String movementType
    ) {
        return ApiResponse.success(service.list(pageRequest, productId, movementType));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.inventory.read")
    public ApiResponse<PetInventoryMovementResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.inventory.create")
    public ApiResponse<PetInventoryMovementResponse> create(@Valid @RequestBody PetInventoryMovementCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.inventory.update")
    public ApiResponse<PetInventoryMovementResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetInventoryMovementUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.inventory.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.inventory.delete")
    public ApiResponse<PetInventoryMovementResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
