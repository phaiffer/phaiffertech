package com.phaiffertech.platform.modules.pet.petprofile.controller;

import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileCreateRequest;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileResponse;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileUpdateRequest;
import com.phaiffertech.platform.modules.pet.petprofile.service.PetProfileService;
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
@RequestMapping("/api/v1/pet/pets")
public class PetProfileController {

    private final PetProfileService service;

    public PetProfileController(PetProfileService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.profile.read")
    public ApiResponse<PageResponseDto<PetProfileResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID clientId
    ) {
        return ApiResponse.success(service.list(pageRequest, clientId));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.profile.read")
    public ApiResponse<PetProfileResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.profile.create")
    public ApiResponse<PetProfileResponse> create(@Valid @RequestBody PetProfileCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.profile.update")
    public ApiResponse<PetProfileResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetProfileUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.profile.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.profile.delete")
    public ApiResponse<PetProfileResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
