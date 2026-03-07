package com.phaiffertech.platform.modules.iot.capability;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.modules.iot.monitoring.dto.IotDashboardSummaryResponse;
import com.phaiffertech.platform.modules.iot.monitoring.service.IotDashboardService;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardModuleSummaryDto;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class IotDashboardCapabilityService implements IotDashboardCapability {

    private final IotDashboardService iotDashboardService;

    public IotDashboardCapabilityService(IotDashboardService iotDashboardService) {
        this.iotDashboardService = iotDashboardService;
    }

    @Override
    public String moduleCode() {
        return PlatformModule.IOT.getCode();
    }

    @Override
    public String requiredPermission() {
        return "iot.dashboard.read";
    }

    @Override
    public DashboardModuleSummaryDto summarize(UUID tenantId) {
        IotDashboardSummaryResponse summary = iotDashboardService.summary(tenantId);
        return new DashboardModuleSummaryDto(
                moduleCode(),
                "IoT",
                "Devices, alarms, telemetry flow and maintenance queue.",
                "/iot/dashboard",
                summary.summaryCards()
        );
    }
}
