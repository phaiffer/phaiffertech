package com.phaiffertech.platform.modules.pet.capability;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.modules.pet.dashboard.dto.PetDashboardSummaryResponse;
import com.phaiffertech.platform.modules.pet.dashboard.service.PetDashboardService;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardModuleSummaryDto;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PetDashboardCapabilityService implements PetDashboardCapability {

    private final PetDashboardService petDashboardService;

    public PetDashboardCapabilityService(PetDashboardService petDashboardService) {
        this.petDashboardService = petDashboardService;
    }

    @Override
    public String moduleCode() {
        return PlatformModule.PET.getCode();
    }

    @Override
    public String requiredPermission() {
        return "pet.dashboard.read";
    }

    @Override
    public DashboardModuleSummaryDto summarize(UUID tenantId) {
        PetDashboardSummaryResponse summary = petDashboardService.summary(tenantId);
        return new DashboardModuleSummaryDto(
                moduleCode(),
                "Pet",
                "Clinical agenda, medical workflow and commercial backlog for the tenant.",
                "/pet/dashboard",
                summary.summaryCards()
        );
    }
}
