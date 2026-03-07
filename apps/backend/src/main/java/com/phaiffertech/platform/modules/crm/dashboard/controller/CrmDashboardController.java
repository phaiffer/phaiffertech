package com.phaiffertech.platform.modules.crm.dashboard.controller;

import com.phaiffertech.platform.modules.crm.dashboard.dto.CrmDashboardSummaryResponse;
import com.phaiffertech.platform.modules.crm.dashboard.service.CrmDashboardService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/dashboard")
public class CrmDashboardController {

    private final CrmDashboardService service;

    public CrmDashboardController(CrmDashboardService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @RequirePermission("crm.dashboard.read")
    public ApiResponse<CrmDashboardSummaryResponse> summary() {
        return ApiResponse.success(service.summary());
    }
}
