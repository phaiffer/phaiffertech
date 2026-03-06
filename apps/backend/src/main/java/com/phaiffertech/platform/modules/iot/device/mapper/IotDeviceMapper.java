package com.phaiffertech.platform.modules.iot.device.mapper;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;

public final class IotDeviceMapper {

    private IotDeviceMapper() {
    }

    public static IotDeviceResponse toResponse(IotDevice device) {
        return new IotDeviceResponse(
                device.getId(),
                device.getName(),
                device.getSerialNumber(),
                device.getStatus(),
                device.getLastSeenAt()
        );
    }
}
