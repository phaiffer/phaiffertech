package com.phaiffertech.platform.modules.iot.capability;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.modules.iot.monitoring.dto.IotDashboardSummaryResponse;
import com.phaiffertech.platform.modules.iot.monitoring.service.IotDashboardService;
import com.phaiffertech.platform.shared.contracts.module.ModuleMetricView;
import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryView;
import java.util.List;
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
    public ModuleSummaryView summarize(UUID tenantId) {
        IotDashboardSummaryResponse summary = iotDashboardService.summary(tenantId);
        return new ModuleSummaryView(
                moduleCode(),
                "IoT",
                "Devices, alarms, telemetry flow and maintenance queue.",
                "/iot/dashboard",
                List.of(
                        new ModuleMetricView("devices", "Devices", summary.totalDevices()),
                        new ModuleMetricView("activeDevices", "Active", summary.activeDevices()),
                        new ModuleMetricView("offlineDevices", "Offline", summary.offlineDevices()),
                        new ModuleMetricView("openAlarms", "Open Alarms", summary.totalAlarmsOpen()),
                        new ModuleMetricView("maintenance", "Pending Maintenance", summary.pendingMaintenance())
                )
        );
    }
}
