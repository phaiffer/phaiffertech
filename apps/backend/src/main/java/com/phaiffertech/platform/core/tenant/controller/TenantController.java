package com.phaiffertech.platform.core.tenant.controller;

import com.phaiffertech.platform.core.tenant.service.TenantService;
import com.phaiffertech.platform.core.tenant.dto.TenantCreateRequest;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import com.phaiffertech.platform.core.tenant.dto.TenantUpdateRequest;
import com.phaiffertech.platform.shared.usage.dto.TenantUsageMetricResponse;
import com.phaiffertech.platform.shared.usage.UsageTelemetryQueryService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantService tenantService;
    private final UsageTelemetryQueryService usageTelemetryQueryService;

    public TenantController(TenantService tenantService, UsageTelemetryQueryService usageTelemetryQueryService) {
        this.tenantService = tenantService;
        this.usageTelemetryQueryService = usageTelemetryQueryService;
    }

    @PostMapping
    @RequirePermission("TENANT_WRITE")
    public ApiResponse<TenantResponse> create(@Valid @RequestBody TenantCreateRequest request) {
        return ApiResponse.success(tenantService.create(request));
    }

    @PutMapping("/{tenantId}")
    @RequirePermission("TENANT_WRITE")
    public ApiResponse<TenantResponse> update(@PathVariable java.util.UUID tenantId, @Valid @RequestBody TenantUpdateRequest request) {
        return ApiResponse.success(tenantService.update(tenantId, request));
    }

    @GetMapping
    @RequirePermission("TENANT_READ")
    public ApiResponse<PageResponseDto<TenantResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(tenantService.list(pageRequest));
    }

    @GetMapping("/{tenantId}/usage-metrics")
    @RequirePermission("TENANT_READ")
    public ApiResponse<List<TenantUsageMetricResponse>> listUsageMetrics(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "30") @Min(1) @Max(365) int days,
            @RequestParam(defaultValue = "12") @Min(1) @Max(100) int limit
    ) {
        return ApiResponse.success(usageTelemetryQueryService.listRecentForTenant(tenantId, days, limit));
    }
}
