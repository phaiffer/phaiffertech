package com.phaiffertech.platform.modules.pet.dashboard.dto;

import com.phaiffertech.platform.shared.dashboard.dto.DashboardSectionDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSummaryCardDto;
import java.util.List;

public record PetDashboardSummaryResponse(
        long totalClients,
        long totalPets,
        long appointmentsToday,
        long upcomingAppointments,
        long totalServices,
        long lowStockProducts,
        long pendingInvoices,
        List<DashboardSummaryCardDto> summaryCards,
        List<DashboardSectionDto> sections
) {
}
