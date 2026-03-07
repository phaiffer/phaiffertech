package com.phaiffertech.platform.modules.iot.alarm.controller;

import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmCreateRequest;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmResponse;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmUpdateRequest;
import com.phaiffertech.platform.modules.iot.alarm.service.IotAlarmService;
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
@RequestMapping("/api/v1/iot/alarms")
public class IotAlarmController {

    private final IotAlarmService service;

    public IotAlarmController(IotAlarmService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("iot.alarm.read")
    public ApiResponse<PageResponseDto<IotAlarmResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(name = "device_id", required = false) UUID deviceIdSnake,
            @RequestParam(required = false) UUID registerId,
            @RequestParam(name = "register_id", required = false) UUID registerIdSnake,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Instant triggeredFrom,
            @RequestParam(required = false) Instant triggeredTo
    ) {
        return ApiResponse.success(service.list(
                pageRequest,
                deviceId != null ? deviceId : deviceIdSnake,
                registerId != null ? registerId : registerIdSnake,
                severity,
                status,
                triggeredFrom,
                triggeredTo
        ));
    }

    @GetMapping("/{id}")
    @RequirePermission("iot.alarm.read")
    public ApiResponse<IotAlarmResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("iot.alarm.create")
    public ApiResponse<IotAlarmResponse> create(@Valid @RequestBody IotAlarmCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("iot.alarm.update")
    public ApiResponse<IotAlarmResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody IotAlarmUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("iot.alarm.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/acknowledge")
    @RequirePermission("iot.alarm.ack")
    public ApiResponse<IotAlarmResponse> acknowledge(@PathVariable UUID id) {
        return ApiResponse.success(service.acknowledge(id));
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("iot.alarm.delete")
    public ApiResponse<IotAlarmResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
