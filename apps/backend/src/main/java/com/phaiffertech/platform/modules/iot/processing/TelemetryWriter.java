package com.phaiffertech.platform.modules.iot.processing;

import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import java.util.UUID;

public interface TelemetryWriter {

    IotTelemetryResponse write(UUID tenantId, IotTelemetryCreateRequest request);
}
