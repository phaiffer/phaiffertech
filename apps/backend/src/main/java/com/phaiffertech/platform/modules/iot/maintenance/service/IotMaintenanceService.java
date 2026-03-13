package com.phaiffertech.platform.modules.iot.maintenance.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.maintenance.domain.IotMaintenance;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceCreateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceResponse;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceUpdateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.mapper.IotMaintenanceMapper;
import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.time.Instant;
import java.util.Collections;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
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
    private final IotAlarmRepository alarmRepository;
    private final IotRegisterRepository registerRepository;
    private final UserTenantRepository userTenantRepository;

    public IotMaintenanceService(
            IotMaintenanceRepository repository,
            IotDeviceRepository deviceRepository,
            IotAlarmRepository alarmRepository,
            IotRegisterRepository registerRepository,
            UserTenantRepository userTenantRepository
    ) {
        super(repository, repository, IotMaintenanceMapper.INSTANCE, "IoT maintenance record not found.");
        this.repository = repository;
        this.deviceRepository = deviceRepository;
        this.alarmRepository = alarmRepository;
        this.registerRepository = registerRepository;
        this.userTenantRepository = userTenantRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, IotMaintenanceCreateRequest request, IotMaintenance entity) {
        validateDevice(tenantId, entity.getDeviceId());
        validateSchedule(entity.getScheduledAt(), entity.getCompletedAt());
        validateOperationalContext(tenantId, entity);
    }

    @Override
    public void beforeUpdate(UUID tenantId, IotMaintenanceUpdateRequest request, IotMaintenance entity) {
        validateDevice(tenantId, entity.getDeviceId());
        validateSchedule(entity.getScheduledAt(), entity.getCompletedAt());
        validateOperationalContext(tenantId, entity);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_maintenance")
    public IotMaintenanceResponse create(IotMaintenanceCreateRequest request) {
        UUID tenantId = currentTenantId();
        IotMaintenance entity = IotMaintenanceMapper.INSTANCE.toNewEntity(request);
        entity.setTenantId(tenantId);

        beforeCreate(tenantId, request, entity);
        return toOperationalResponse(tenantId, repository.save(entity));
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
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(
                pageRequest,
                Sort.by(Sort.Direction.ASC, "scheduledAt").and(Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        Page<IotMaintenance> page = repository.findAllByTenantIdAndSearch(
                tenantId,
                deviceId,
                normalizeUpper(status),
                normalizeUpper(priority),
                scheduledFrom,
                scheduledTo,
                query.search(),
                query.pageable()
        );

        Map<UUID, String> alarmCodes = resolveAlarmCodes(tenantId, page.getContent());
        return PaginationUtils.fromPage(
                page.map(record -> toOperationalResponse(
                        record,
                        record.getLinkedAlarmId() == null ? null : alarmCodes.get(record.getLinkedAlarmId())
                ))
        );
    }

    @Transactional(readOnly = true)
    public IotMaintenanceResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toOperationalResponse(tenantId, getOrThrow(id, tenantId));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_maintenance")
    public IotMaintenanceResponse update(UUID id, IotMaintenanceUpdateRequest request) {
        UUID tenantId = currentTenantId();
        IotMaintenance entity = getOrThrow(id, tenantId);

        IotMaintenanceMapper.INSTANCE.updateEntity(entity, request);
        beforeUpdate(tenantId, request, entity);

        return toOperationalResponse(tenantId, repository.save(entity));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "iot_maintenance")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "iot_maintenance")
    public IotMaintenanceResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        IotMaintenance entity = getIncludingDeletedOrThrow(id, tenantId);
        restore(entity);
        return toOperationalResponse(tenantId, repository.save(entity));
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

    private void validateOperationalContext(UUID tenantId, IotMaintenance entity) {
        validateAssignedUser(tenantId, entity.getAssignedUserId());
        IotAlarm linkedAlarm = resolveLinkedAlarm(tenantId, entity.getLinkedAlarmId());
        IotRegister linkedRegister = resolveLinkedRegister(tenantId, entity.getLinkedRegisterId());

        if (linkedAlarm != null && !linkedAlarm.getDeviceId().equals(entity.getDeviceId())) {
            throw new IllegalArgumentException("Linked alarm must belong to the informed device.");
        }

        if (linkedRegister != null && !linkedRegister.getDeviceId().equals(entity.getDeviceId())) {
            throw new IllegalArgumentException("Linked register must belong to the informed device.");
        }

        if (linkedAlarm != null && linkedAlarm.getRegisterId() != null) {
            if (linkedRegister != null && !linkedAlarm.getRegisterId().equals(linkedRegister.getId())) {
                throw new IllegalArgumentException("Linked register must match the register already associated with the alarm.");
            }
            entity.setLinkedRegisterId(linkedAlarm.getRegisterId());
            if (linkedRegister == null) {
                linkedRegister = resolveLinkedRegister(tenantId, linkedAlarm.getRegisterId());
            }
        }

        entity.setOrigin(resolveOrigin(entity.getOrigin(), linkedAlarm, linkedRegister));
        entity.setTrigger(resolveTrigger(entity.getTrigger(), linkedAlarm));
    }

    private IotAlarm resolveLinkedAlarm(UUID tenantId, UUID linkedAlarmId) {
        if (linkedAlarmId == null) {
            return null;
        }
        return alarmRepository.findByIdAndTenantId(linkedAlarmId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT alarm not found for tenant."));
    }

    private IotRegister resolveLinkedRegister(UUID tenantId, UUID linkedRegisterId) {
        if (linkedRegisterId == null) {
            return null;
        }
        return registerRepository.findByIdAndTenantId(linkedRegisterId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT register not found for tenant."));
    }

    private String resolveOrigin(String origin, IotAlarm linkedAlarm, IotRegister linkedRegister) {
        if (origin != null && !origin.isBlank()) {
            return origin.trim().toUpperCase();
        }
        if (linkedAlarm != null) {
            return "ALARM";
        }
        if (linkedRegister != null) {
            return "REGISTER";
        }
        return "MANUAL";
    }

    private void validateAssignedUser(UUID tenantId, UUID assignedUserId) {
        if (assignedUserId == null) {
            return;
        }
        if (!userTenantRepository.existsByTenantIdAndUserIdAndActiveTrue(tenantId, assignedUserId)) {
            throw new ResourceNotFoundException("IoT maintenance assigned user not found for tenant.");
        }
    }

    private String resolveTrigger(String trigger, IotAlarm linkedAlarm) {
        if (trigger != null && !trigger.isBlank()) {
            return trigger.trim();
        }
        return linkedAlarm == null ? null : linkedAlarm.getMessage();
    }

    private IotMaintenanceResponse toOperationalResponse(UUID tenantId, IotMaintenance entity) {
        return toOperationalResponse(entity, resolveAlarmCode(tenantId, entity.getLinkedAlarmId()));
    }

    private IotMaintenanceResponse toOperationalResponse(IotMaintenance entity, String linkedAlarmCode) {
        return IotMaintenanceMapper.INSTANCE.toResponse(entity, linkedAlarmCode);
    }

    private String resolveAlarmCode(UUID tenantId, UUID linkedAlarmId) {
        if (linkedAlarmId == null) {
            return null;
        }
        return alarmRepository.findByIdAndTenantId(linkedAlarmId, tenantId)
                .map(IotAlarm::getCode)
                .orElse(null);
    }

    private Map<UUID, String> resolveAlarmCodes(UUID tenantId, Collection<IotMaintenance> maintenanceRecords) {
        var linkedAlarmIds = maintenanceRecords.stream()
                .map(IotMaintenance::getLinkedAlarmId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (linkedAlarmIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return alarmRepository.findAllByTenantIdAndIdIn(tenantId, linkedAlarmIds).stream()
                .collect(Collectors.toMap(IotAlarm::getId, IotAlarm::getCode, (left, right) -> left));
    }

    private String normalizeUpper(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }
}
