package com.phaiffertech.platform.modules.iot.part.controller;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartCreateRequest;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartMovementCreateRequest;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartMovementResponse;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartResponse;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartUpdateRequest;
import com.phaiffertech.platform.modules.iot.part.service.IotPartService;
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
@RequestMapping("/api/v1/iot/parts")
@RequirePermission(entitlement = TenantEntitlementKeys.IOT_BASIC)
public class IotPartController {

    private final IotPartService service;

    public IotPartController(IotPartService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("iot.part.read")
    public ApiResponse<PageResponseDto<IotPartResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String category
    ) {
        return ApiResponse.success(service.list(pageRequest, category));
    }

    @GetMapping("/{id}")
    @RequirePermission("iot.part.read")
    public ApiResponse<IotPartResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("iot.part.create")
    public ApiResponse<IotPartResponse> create(@Valid @RequestBody IotPartCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("iot.part.update")
    public ApiResponse<IotPartResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody IotPartUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("iot.part.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("iot.part.delete")
    public ApiResponse<IotPartResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }

    @GetMapping("/movements")
    @RequirePermission("iot.part.read")
    public ApiResponse<PageResponseDto<IotPartMovementResponse>> listMovements(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID partId,
            @RequestParam(required = false) String movementType
    ) {
        return ApiResponse.success(service.listMovements(pageRequest, partId, movementType));
    }

    @PostMapping("/{id}/movements")
    @RequirePermission("iot.part.update")
    public ApiResponse<IotPartMovementResponse> createMovement(
            @PathVariable UUID id,
            @Valid @RequestBody IotPartMovementCreateRequest request
    ) {
        return ApiResponse.success(service.createMovement(id, request));
    }
}
