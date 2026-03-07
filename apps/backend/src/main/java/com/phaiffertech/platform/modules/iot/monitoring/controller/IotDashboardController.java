package com.phaiffertech.platform.modules.iot.monitoring.controller;

import com.phaiffertech.platform.modules.iot.monitoring.dto.IotDashboardSummaryResponse;
import com.phaiffertech.platform.modules.iot.monitoring.service.MonitoringSummaryService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/iot/dashboard")
public class IotDashboardController {

    private final MonitoringSummaryService monitoringSummaryService;

    public IotDashboardController(MonitoringSummaryService monitoringSummaryService) {
        this.monitoringSummaryService = monitoringSummaryService;
    }

    @GetMapping("/summary")
    @RequirePermission("iot.dashboard.read")
    public ApiResponse<IotDashboardSummaryResponse> summary() {
        return ApiResponse.success(monitoringSummaryService.summary());
    }
}
