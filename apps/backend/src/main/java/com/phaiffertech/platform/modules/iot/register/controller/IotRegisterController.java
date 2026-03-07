package com.phaiffertech.platform.modules.iot.register.controller;

import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterCreateRequest;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterResponse;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterUpdateRequest;
import com.phaiffertech.platform.modules.iot.register.service.IotRegisterService;
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
@RequestMapping("/api/v1/iot/registers")
public class IotRegisterController {

    private final IotRegisterService service;

    public IotRegisterController(IotRegisterService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("iot.register.read")
    public ApiResponse<PageResponseDto<IotRegisterResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(name = "device_id", required = false) UUID deviceIdSnake,
            @RequestParam(required = false) String metricName,
            @RequestParam(name = "metric_name", required = false) String metricNameSnake,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(service.list(
                pageRequest,
                deviceId != null ? deviceId : deviceIdSnake,
                metricName != null ? metricName : metricNameSnake,
                status
        ));
    }

    @GetMapping("/{id}")
    @RequirePermission("iot.register.read")
    public ApiResponse<IotRegisterResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("iot.register.create")
    public ApiResponse<IotRegisterResponse> create(@Valid @RequestBody IotRegisterCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("iot.register.update")
    public ApiResponse<IotRegisterResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody IotRegisterUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("iot.register.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("iot.register.delete")
    public ApiResponse<IotRegisterResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
