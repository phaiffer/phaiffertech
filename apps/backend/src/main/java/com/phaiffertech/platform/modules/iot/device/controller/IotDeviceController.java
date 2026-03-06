package com.phaiffertech.platform.modules.iot.device.controller;

import com.phaiffertech.platform.modules.iot.device.service.IotDeviceService;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
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
@RequestMapping("/api/v1/iot/devices")
public class IotDeviceController {

    private final IotDeviceService service;

    public IotDeviceController(IotDeviceService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<IotDeviceResponse> create(@Valid @RequestBody IotDeviceCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @GetMapping
    @RequirePermission("iot.device.read")
    public ApiResponse<PageResponseDto<IotDeviceResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }
}
