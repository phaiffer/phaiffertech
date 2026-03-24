package com.phaiffertech.platform.modules.pet.dashboard.dto;

import com.phaiffertech.platform.shared.dashboard.dto.DashboardCountMetricDto;
import java.util.List;

public record PetInsightsSummaryResponse(
        long newClientsThisMonth,
        long newClientsLastMonth,
        List<DashboardCountMetricDto> topServices,
        List<DashboardCountMetricDto> speciesMix,
        List<DashboardCountMetricDto> appointmentsByStatus
) {
}
