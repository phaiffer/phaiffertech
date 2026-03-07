package com.phaiffertech.platform.modules.iot.maintenance.controller;

import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceCreateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceResponse;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceUpdateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.service.IotMaintenanceService;
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
@RequestMapping("/api/v1/iot/maintenance")
public class IotMaintenanceController {

    private final IotMaintenanceService service;

    public IotMaintenanceController(IotMaintenanceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("iot.maintenance.read")
    public ApiResponse<PageResponseDto<IotMaintenanceResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(name = "device_id", required = false) UUID deviceIdSnake,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Instant startAt,
            @RequestParam(name = "start_at", required = false) Instant startAtSnake,
            @RequestParam(required = false) Instant endAt,
            @RequestParam(name = "end_at", required = false) Instant endAtSnake
    ) {
        return ApiResponse.success(service.list(
                pageRequest,
                deviceId != null ? deviceId : deviceIdSnake,
                status,
                priority,
                startAt != null ? startAt : startAtSnake,
                endAt != null ? endAt : endAtSnake
        ));
    }

    @GetMapping("/{id}")
    @RequirePermission("iot.maintenance.read")
    public ApiResponse<IotMaintenanceResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("iot.maintenance.create")
    public ApiResponse<IotMaintenanceResponse> create(@Valid @RequestBody IotMaintenanceCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("iot.maintenance.update")
    public ApiResponse<IotMaintenanceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody IotMaintenanceUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("iot.maintenance.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("iot.maintenance.delete")
    public ApiResponse<IotMaintenanceResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
