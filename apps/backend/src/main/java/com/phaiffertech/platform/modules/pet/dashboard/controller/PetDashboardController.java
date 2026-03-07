package com.phaiffertech.platform.modules.pet.dashboard.controller;

import com.phaiffertech.platform.modules.pet.dashboard.dto.PetDashboardSummaryResponse;
import com.phaiffertech.platform.modules.pet.dashboard.service.PetDashboardService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/dashboard")
public class PetDashboardController {

    private final PetDashboardService petDashboardService;

    public PetDashboardController(PetDashboardService petDashboardService) {
        this.petDashboardService = petDashboardService;
    }

    @GetMapping("/summary")
    @RequirePermission("pet.dashboard.read")
    public ApiResponse<PetDashboardSummaryResponse> summary() {
        return ApiResponse.success(petDashboardService.summary());
    }
}
