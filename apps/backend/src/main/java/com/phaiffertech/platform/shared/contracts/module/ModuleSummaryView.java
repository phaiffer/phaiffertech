package com.phaiffertech.platform.shared.contracts.module;

import java.util.List;

public record ModuleSummaryView(
        String moduleCode,
        String title,
        String description,
        String href,
        List<ModuleMetricView> metrics
) {
}
