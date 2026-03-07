package com.phaiffertech.platform.modules.iot.maintenance.mapper;

import com.phaiffertech.platform.modules.iot.maintenance.domain.IotMaintenance;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceCreateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceResponse;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.time.Instant;

public final class IotMaintenanceMapper implements BaseCrudMapper<
        IotMaintenance,
        IotMaintenanceCreateRequest,
        IotMaintenanceUpdateRequest,
        IotMaintenanceResponse> {

    public static final IotMaintenanceMapper INSTANCE = new IotMaintenanceMapper();

    private IotMaintenanceMapper() {
    }

    @Override
    public IotMaintenance toNewEntity(IotMaintenanceCreateRequest request) {
        IotMaintenance entity = new IotMaintenance();
        entity.setDeviceId(request.deviceId());
        entity.setTitle(request.title().trim());
        entity.setDescription(normalizeText(request.description()));
        entity.setStatus(resolveStatus(request.status()));
        entity.setPriority(resolvePriority(request.priority()));
        entity.setScheduledAt(request.scheduledAt());
        entity.setCompletedAt(resolveCompletedAt(entity.getStatus(), request.completedAt()));
        entity.setAssignedUserId(request.assignedUserId());
        return entity;
    }

    @Override
    public void updateEntity(IotMaintenance entity, IotMaintenanceUpdateRequest request) {
        entity.setDeviceId(request.deviceId());
        entity.setTitle(request.title().trim());
        entity.setDescription(normalizeText(request.description()));
        entity.setStatus(resolveStatus(request.status()));
        entity.setPriority(resolvePriority(request.priority()));
        entity.setScheduledAt(request.scheduledAt());
        entity.setCompletedAt(resolveCompletedAt(entity.getStatus(), request.completedAt()));
        entity.setAssignedUserId(request.assignedUserId());
    }

    @Override
    public IotMaintenanceResponse toResponse(IotMaintenance entity) {
        return new IotMaintenanceResponse(
                entity.getId(),
                entity.getDeviceId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getPriority(),
                entity.getScheduledAt(),
                entity.getCompletedAt(),
                entity.getAssignedUserId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }
        return status.trim().toUpperCase();
    }

    private String resolvePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "MEDIUM";
        }
        return priority.trim().toUpperCase();
    }

    private Instant resolveCompletedAt(String status, Instant completedAt) {
        if ("COMPLETED".equalsIgnoreCase(status)) {
            return completedAt == null ? Instant.now() : completedAt;
        }
        return completedAt;
    }
}
