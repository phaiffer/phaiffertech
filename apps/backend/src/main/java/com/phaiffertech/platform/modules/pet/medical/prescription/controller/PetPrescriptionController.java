package com.phaiffertech.platform.modules.pet.medical.prescription.controller;

import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionResponse;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.service.PetPrescriptionService;
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
@RequestMapping("/api/v1/pet/prescriptions")
public class PetPrescriptionController {

    private final PetPrescriptionService service;

    public PetPrescriptionController(PetPrescriptionService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.prescription.read")
    public ApiResponse<PageResponseDto<PetPrescriptionResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) UUID professionalId
    ) {
        return ApiResponse.success(service.list(pageRequest, petId, professionalId));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.prescription.read")
    public ApiResponse<PetPrescriptionResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.prescription.create")
    public ApiResponse<PetPrescriptionResponse> create(@Valid @RequestBody PetPrescriptionCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.prescription.update")
    public ApiResponse<PetPrescriptionResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetPrescriptionUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.prescription.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.prescription.delete")
    public ApiResponse<PetPrescriptionResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
