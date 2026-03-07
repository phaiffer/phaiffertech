package com.phaiffertech.platform.core.module.featureflag.controller;

import com.phaiffertech.platform.core.module.featureflag.dto.FeatureFlagViewResponse;
import com.phaiffertech.platform.core.module.featureflag.service.FeatureFlagService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
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
}
