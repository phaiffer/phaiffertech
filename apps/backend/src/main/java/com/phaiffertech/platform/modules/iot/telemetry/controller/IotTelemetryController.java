package com.phaiffertech.platform.modules.iot.telemetry.controller;

import com.phaiffertech.platform.modules.iot.processing.TelemetryReader;
import com.phaiffertech.platform.modules.iot.processing.TelemetryWriter;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/iot/telemetry")
public class IotTelemetryController {

    private final TelemetryWriter telemetryWriter;
    private final TelemetryReader telemetryReader;

    public IotTelemetryController(TelemetryWriter telemetryWriter, TelemetryReader telemetryReader) {
        this.telemetryWriter = telemetryWriter;
        this.telemetryReader = telemetryReader;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<IotTelemetryResponse> ingest(@Valid @RequestBody IotTelemetryCreateRequest request) {
        return ApiResponse.success(telemetryWriter.write(TenantContext.getRequiredTenantId(), request));
    }

    @GetMapping
    @RequirePermission("iot.device.read")
    public ApiResponse<PageResponseDto<IotTelemetryResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(telemetryReader.list(TenantContext.getRequiredTenantId(), pageRequest));
    }
}
