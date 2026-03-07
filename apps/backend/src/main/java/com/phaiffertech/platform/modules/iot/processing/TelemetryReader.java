package com.phaiffertech.platform.modules.iot.processing;

import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryResponse;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.time.Instant;
import java.util.UUID;

public interface TelemetryReader {

    PageResponseDto<IotTelemetryResponse> list(
            UUID tenantId,
            PageRequestDto pageRequest,
            UUID deviceId,
            Instant recordedFrom,
            Instant recordedTo
    );
}
