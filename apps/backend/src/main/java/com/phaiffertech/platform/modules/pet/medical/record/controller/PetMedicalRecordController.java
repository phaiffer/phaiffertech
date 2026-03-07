package com.phaiffertech.platform.modules.pet.medical.record.controller;

import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordResponse;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.service.PetMedicalRecordService;
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
@RequestMapping("/api/v1/pet/medical-records")
public class PetMedicalRecordController {

    private final PetMedicalRecordService service;

    public PetMedicalRecordController(PetMedicalRecordService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.medical-record.read")
    public ApiResponse<PageResponseDto<PetMedicalRecordResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) UUID professionalId
    ) {
        return ApiResponse.success(service.list(pageRequest, petId, professionalId));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.medical-record.read")
    public ApiResponse<PetMedicalRecordResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.medical-record.create")
    public ApiResponse<PetMedicalRecordResponse> create(@Valid @RequestBody PetMedicalRecordCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.medical-record.update")
    public ApiResponse<PetMedicalRecordResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetMedicalRecordUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.medical-record.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.medical-record.delete")
    public ApiResponse<PetMedicalRecordResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
