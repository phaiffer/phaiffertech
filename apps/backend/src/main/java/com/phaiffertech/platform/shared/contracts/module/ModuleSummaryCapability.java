package com.phaiffertech.platform.shared.contracts.module;

import com.phaiffertech.platform.shared.dashboard.dto.DashboardModuleSummaryDto;
import java.util.UUID;

public interface ModuleSummaryCapability {

    String moduleCode();

    default String requiredPermission() {
        return null;
    }

    DashboardModuleSummaryDto summarize(UUID tenantId);
}
