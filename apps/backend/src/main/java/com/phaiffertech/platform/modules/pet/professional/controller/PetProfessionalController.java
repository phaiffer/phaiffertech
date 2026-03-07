package com.phaiffertech.platform.modules.pet.professional.controller;

import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalCreateRequest;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalResponse;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalUpdateRequest;
import com.phaiffertech.platform.modules.pet.professional.service.PetProfessionalService;
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
@RequestMapping("/api/v1/pet/professionals")
public class PetProfessionalController {

    private final PetProfessionalService service;

    public PetProfessionalController(PetProfessionalService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.professional.read")
    public ApiResponse<PageResponseDto<PetProfessionalResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.professional.read")
    public ApiResponse<PetProfessionalResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.professional.create")
    public ApiResponse<PetProfessionalResponse> create(@Valid @RequestBody PetProfessionalCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.professional.update")
    public ApiResponse<PetProfessionalResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetProfessionalUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.professional.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.professional.delete")
    public ApiResponse<PetProfessionalResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
