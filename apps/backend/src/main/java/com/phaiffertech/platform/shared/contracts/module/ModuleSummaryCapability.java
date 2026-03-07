package com.phaiffertech.platform.shared.contracts.module;

import java.util.UUID;

public interface ModuleSummaryCapability {

    String moduleCode();

    ModuleSummaryView summarize(UUID tenantId);
}
