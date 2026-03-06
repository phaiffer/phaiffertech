package com.phaiffertech.platform.modules.pet.client.controller;

import com.phaiffertech.platform.modules.pet.client.service.PetClientService;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/clients")
public class PetClientController {

    private final PetClientService service;

    public PetClientController(PetClientService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<PetClientResponse> create(@Valid @RequestBody PetClientCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @GetMapping
    @RequirePermission("pet.client.read")
    public ApiResponse<PageResponseDto<PetClientResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }
}
