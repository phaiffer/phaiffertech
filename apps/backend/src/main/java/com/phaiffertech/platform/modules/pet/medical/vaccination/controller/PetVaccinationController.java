package com.phaiffertech.platform.modules.pet.medical.vaccination.controller;

import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationResponse;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.service.PetVaccinationService;
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
@RequestMapping("/api/v1/pet/vaccinations")
public class PetVaccinationController {

    private final PetVaccinationService service;

    public PetVaccinationController(PetVaccinationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.vaccination.read")
    public ApiResponse<PageResponseDto<PetVaccinationResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID petId
    ) {
        return ApiResponse.success(service.list(pageRequest, petId));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.vaccination.read")
    public ApiResponse<PetVaccinationResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.vaccination.create")
    public ApiResponse<PetVaccinationResponse> create(@Valid @RequestBody PetVaccinationCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.vaccination.update")
    public ApiResponse<PetVaccinationResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetVaccinationUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.vaccination.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.vaccination.delete")
    public ApiResponse<PetVaccinationResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
