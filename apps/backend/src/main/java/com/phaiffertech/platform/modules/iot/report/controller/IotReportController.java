package com.phaiffertech.platform.modules.iot.report.controller;

import com.phaiffertech.platform.modules.iot.report.dto.IotReportSummaryResponse;
import com.phaiffertech.platform.modules.iot.report.service.IotReportService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/iot/reports")
public class IotReportController {

    private final IotReportService service;

    public IotReportController(IotReportService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @RequirePermission("iot.report.read")
    public ApiResponse<IotReportSummaryResponse> summary() {
        return ApiResponse.success(service.summary());
    }
}
