package com.phaiffertech.platform.modules.pet.plan.controller;

import com.phaiffertech.platform.modules.pet.plan.dto.ClientPlanDtos;
import com.phaiffertech.platform.modules.pet.plan.service.ClientPlanService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pet/plans")
public class ClientPlanController {

    private final ClientPlanService service;

    public ClientPlanController(ClientPlanService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("pet.plan.create")
    public ApiResponse<ClientPlanDtos.ClientPlanResponseDto> create(
            @Valid @RequestBody ClientPlanDtos.ClientPlanCreateDto dto) {
        return ApiResponse.success(service.create(dto));
    }

    @GetMapping("/{id}")
    @RequirePermission("pet.plan.read")
    public ApiResponse<ClientPlanDtos.ClientPlanResponseDto> findById(@PathVariable UUID id) {
        return ApiResponse.success(service.findByIdAsDto(id));
    }

    @GetMapping
    @RequirePermission("pet.plan.read")
    public ApiResponse<PageResponseDto<ClientPlanDtos.ClientPlanResponseDto>> findAll(
            @Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.findAll(pageRequest));
    }

    @PutMapping("/{id}")
    @RequirePermission("pet.plan.create")
    public ApiResponse<ClientPlanDtos.ClientPlanResponseDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody ClientPlanDtos.ClientPlanUpdateDto dto) {
        return ApiResponse.success(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("pet.plan.create")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/use-session")
    @RequirePermission("pet.plan.use")
    public ApiResponse<ClientPlanDtos.ClientPlanResponseDto> useSession(@PathVariable UUID id) {
        return ApiResponse.success(service.useSession(id));
    }
}