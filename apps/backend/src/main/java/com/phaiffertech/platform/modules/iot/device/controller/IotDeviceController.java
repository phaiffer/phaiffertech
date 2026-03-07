package com.phaiffertech.platform.modules.iot.device.controller;

import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceUpdateRequest;
import com.phaiffertech.platform.modules.iot.device.service.IotDeviceService;
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
@RequestMapping("/api/v1/iot/devices")
public class IotDeviceController {

    private final IotDeviceService service;

    public IotDeviceController(IotDeviceService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("iot.device.create")
    public ApiResponse<IotDeviceResponse> create(@Valid @RequestBody IotDeviceCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @GetMapping
    @RequirePermission("iot.device.read")
    public ApiResponse<PageResponseDto<IotDeviceResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(service.list(pageRequest, type, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("iot.device.read")
    public ApiResponse<IotDeviceResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PutMapping("/{id}")
    @RequirePermission("iot.device.update")
    public ApiResponse<IotDeviceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody IotDeviceUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("iot.device.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("iot.device.delete")
    public ApiResponse<IotDeviceResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
