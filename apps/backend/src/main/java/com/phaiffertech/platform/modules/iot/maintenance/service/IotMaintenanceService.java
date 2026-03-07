package com.phaiffertech.platform.modules.iot.maintenance.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.maintenance.domain.IotMaintenance;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceCreateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceResponse;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceUpdateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.mapper.IotMaintenanceMapper;
import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotMaintenanceService extends BaseTenantCrudService<
        IotMaintenance,
        IotMaintenanceCreateRequest,
        IotMaintenanceUpdateRequest,
        IotMaintenanceResponse> {

    private final IotMaintenanceRepository repository;
    private final IotDeviceRepository deviceRepository;

    public IotMaintenanceService(IotMaintenanceRepository repository, IotDeviceRepository deviceRepository) {
        super(repository, repository, IotMaintenanceMapper.INSTANCE, "IoT maintenance record not found.");
        this.repository = repository;
        this.deviceRepository = deviceRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, IotMaintenanceCreateRequest request, IotMaintenance entity) {
        validateDevice(tenantId, entity.getDeviceId());
        validateSchedule(entity.getScheduledAt(), entity.getCompletedAt());
    }

    @Override
    public void beforeUpdate(UUID tenantId, IotMaintenanceUpdateRequest request, IotMaintenance entity) {
        validateDevice(tenantId, entity.getDeviceId());
        validateSchedule(entity.getScheduledAt(), entity.getCompletedAt());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_maintenance")
    public IotMaintenanceResponse create(IotMaintenanceCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotMaintenanceResponse> list(
            PageRequestDto pageRequest,
            UUID deviceId,
            String status,
            String priority,
            Instant scheduledFrom,
            Instant scheduledTo
    ) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.ASC, "scheduledAt").and(Sort.by(Sort.Direction.DESC, "createdAt")),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        deviceId,
                        normalizeUpper(status),
                        normalizeUpper(priority),
                        scheduledFrom,
                        scheduledTo,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public IotMaintenanceResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_maintenance")
    public IotMaintenanceResponse update(UUID id, IotMaintenanceUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "iot_maintenance")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "iot_maintenance")
    public IotMaintenanceResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateDevice(UUID tenantId, UUID deviceId) {
        deviceRepository.findByIdAndTenantId(deviceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT device not found for tenant."));
    }

    private void validateSchedule(Instant scheduledAt, Instant completedAt) {
        if (scheduledAt != null && completedAt != null && completedAt.isBefore(scheduledAt)) {
            throw new IllegalArgumentException("Maintenance completedAt cannot be before scheduledAt.");
        }
    }

    private String normalizeUpper(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }
}
