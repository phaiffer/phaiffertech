package com.phaiffertech.platform.core.module.dto;

import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryView;
import java.util.List;

public record PlatformDashboardSummaryResponse(
        List<ModuleSummaryView> modules
) {
}
