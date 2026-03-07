package com.phaiffertech.platform.modules.iot.register.mapper;

import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterCreateRequest;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterResponse;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class IotRegisterMapper implements BaseCrudMapper<
        IotRegister,
        IotRegisterCreateRequest,
        IotRegisterUpdateRequest,
        IotRegisterResponse> {

    public static final IotRegisterMapper INSTANCE = new IotRegisterMapper();

    private IotRegisterMapper() {
    }

    @Override
    public IotRegister toNewEntity(IotRegisterCreateRequest request) {
        IotRegister entity = new IotRegister();
        entity.setDeviceId(request.deviceId());
        entity.setName(request.name().trim());
        entity.setCode(normalizeUpper(request.code()));
        entity.setMetricName(normalizeMetric(request.metricName()));
        entity.setUnit(normalizeUnit(request.unit()));
        entity.setDataType(normalizeUpper(request.dataType()));
        entity.setMinThreshold(request.minThreshold());
        entity.setMaxThreshold(request.maxThreshold());
        entity.setStatus(resolveStatus(request.status()));
        return entity;
    }

    @Override
    public void updateEntity(IotRegister entity, IotRegisterUpdateRequest request) {
        entity.setDeviceId(request.deviceId());
        entity.setName(request.name().trim());
        entity.setCode(normalizeUpper(request.code()));
        entity.setMetricName(normalizeMetric(request.metricName()));
        entity.setUnit(normalizeUnit(request.unit()));
        entity.setDataType(normalizeUpper(request.dataType()));
        entity.setMinThreshold(request.minThreshold());
        entity.setMaxThreshold(request.maxThreshold());
        entity.setStatus(resolveStatus(request.status()));
    }

    @Override
    public IotRegisterResponse toResponse(IotRegister entity) {
        return new IotRegisterResponse(
                entity.getId(),
                entity.getDeviceId(),
                entity.getName(),
                entity.getCode(),
                entity.getMetricName(),
                entity.getUnit(),
                entity.getDataType(),
                entity.getMinThreshold(),
                entity.getMaxThreshold(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalizeUpper(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeMetric(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String normalizeUnit(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }
}
