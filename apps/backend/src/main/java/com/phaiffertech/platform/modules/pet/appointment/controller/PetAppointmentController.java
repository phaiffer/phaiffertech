package com.phaiffertech.platform.modules.pet.appointment.controller;

import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.modules.pet.appointment.service.PetAppointmentService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.time.Instant;
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
@RequestMapping("/api/v1/pet/appointments")
public class PetAppointmentController {

    private final PetAppointmentService service;

    public PetAppointmentController(PetAppointmentService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.appointment.read")
    public ApiResponse<PageResponseDto<PetAppointmentResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Instant scheduledFrom,
            @RequestParam(required = false) Instant scheduledTo,
            @RequestParam(required = false) UUID assignedUserId,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID petId
    ) {
        return ApiResponse.success(service.list(
                pageRequest,
                status,
                scheduledFrom,
                scheduledTo,
                assignedUserId,
                clientId,
                petId
        ));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.appointment.read")
    public ApiResponse<PetAppointmentResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("pet.appointment.create")
    public ApiResponse<PetAppointmentResponse> create(@Valid @RequestBody PetAppointmentCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.appointment.update")
    public ApiResponse<PetAppointmentResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PetAppointmentUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.appointment.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("pet.appointment.delete")
    public ApiResponse<PetAppointmentResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
