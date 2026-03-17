package com.phaiffertech.platform.core.module.featureflag.controller;

import com.phaiffertech.platform.core.module.featureflag.dto.FeatureFlagUpdateRequest;
import com.phaiffertech.platform.core.module.featureflag.dto.FeatureFlagViewResponse;
import com.phaiffertech.platform.core.module.featureflag.service.FeatureFlagService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    public FeatureFlagController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @GetMapping
    @RequirePermission("MODULE_READ")
    public ApiResponse<List<FeatureFlagViewResponse>> list() {
        return ApiResponse.success(featureFlagService.listForCurrentTenant());
    }

    @GetMapping("/tenants/{tenantId}")
    @RequirePermission("TENANT_READ")
    public ApiResponse<List<FeatureFlagViewResponse>> listForTenant(@PathVariable UUID tenantId) {
        return ApiResponse.success(featureFlagService.listForTenant(tenantId));
    }

    @PutMapping("/tenants/{tenantId}/{flagKey}")
    @RequirePermission("TENANT_WRITE")
    public ApiResponse<FeatureFlagViewResponse> setTenantOverride(
            @PathVariable UUID tenantId,
            @PathVariable String flagKey,
            @Valid @RequestBody FeatureFlagUpdateRequest request
    ) {
        return ApiResponse.success(featureFlagService.setTenantOverride(tenantId, flagKey, request.enabled()));
    }

    @DeleteMapping("/tenants/{tenantId}/{flagKey}")
    @RequirePermission("TENANT_WRITE")
    public ApiResponse<Void> clearTenantOverride(@PathVariable UUID tenantId, @PathVariable String flagKey) {
        featureFlagService.clearTenantOverride(tenantId, flagKey);
        return ApiResponse.success(null);
    }
}
