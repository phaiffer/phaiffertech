package com.phaiffertech.platform.core.module.controller;

import com.phaiffertech.platform.core.module.dto.PlatformDashboardSummaryResponse;
import com.phaiffertech.platform.core.module.service.PlatformDashboardService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class PlatformDashboardController {

    private final PlatformDashboardService platformDashboardService;

    public PlatformDashboardController(PlatformDashboardService platformDashboardService) {
        this.platformDashboardService = platformDashboardService;
    }

    @GetMapping("/summary")
    public ApiResponse<PlatformDashboardSummaryResponse> summary() {
        return ApiResponse.success(platformDashboardService.summary());
    }
}
