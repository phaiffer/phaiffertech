package com.phaiffertech.platform.modules.iot.device.mapper;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class IotDeviceMapper implements BaseCrudMapper<
        IotDevice,
        IotDeviceCreateRequest,
        IotDeviceUpdateRequest,
        IotDeviceResponse> {

    public static final IotDeviceMapper INSTANCE = new IotDeviceMapper();

    private IotDeviceMapper() {
    }

    @Override
    public IotDevice toNewEntity(IotDeviceCreateRequest request) {
        IotDevice device = new IotDevice();
        device.setName(request.name().trim());
        device.setIdentifier(request.identifier().trim());
        device.setSerialNumber(request.identifier().trim());
        device.setType(normalizeUpper(request.type()));
        device.setLocation(request.location());
        device.setStatus(resolveStatus(request.status()));
        return device;
    }

    @Override
    public void updateEntity(IotDevice entity, IotDeviceUpdateRequest request) {
        entity.setName(request.name().trim());
        entity.setIdentifier(request.identifier().trim());
        entity.setSerialNumber(request.identifier().trim());
        entity.setType(normalizeUpper(request.type()));
        entity.setLocation(request.location());
        entity.setStatus(resolveStatus(request.status()));
    }

    @Override
    public IotDeviceResponse toResponse(IotDevice device) {
        return new IotDeviceResponse(
                device.getId(),
                device.getName(),
                device.getIdentifier(),
                device.getType(),
                device.getLocation(),
                device.getStatus(),
                device.getLastSeenAt(),
                device.getCreatedAt(),
                device.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ONLINE";
        }
        return status.trim().toUpperCase();
    }

    private String normalizeUpper(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }
}
