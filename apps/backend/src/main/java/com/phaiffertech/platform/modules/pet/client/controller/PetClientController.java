package com.phaiffertech.platform.modules.pet.client.controller;

import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientUpdateRequest;
import com.phaiffertech.platform.modules.pet.client.service.PetClientService;
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
@RequestMapping("/api/v1/pet/clients")
public class PetClientController {

    private final PetClientService service;

    public PetClientController(PetClientService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("pet.client.create")
    public ApiResponse<PetClientResponse> create(@Valid @RequestBody PetClientCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @GetMapping
    @RequirePermission("pet.client.read")
    public ApiResponse<PageResponseDto<PetClientResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(service.list(pageRequest, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.client.read")
    public ApiResponse<PetClientResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.client.update")
    public ApiResponse<PetClientResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetClientUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.client.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.client.delete")
    public ApiResponse<PetClientResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
