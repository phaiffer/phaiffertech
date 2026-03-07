package com.phaiffertech.platform.modules.iot.alarm.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmCreateRequest;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmResponse;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmUpdateRequest;
import com.phaiffertech.platform.modules.iot.alarm.mapper.IotAlarmMapper;
import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
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
public class IotAlarmService extends BaseTenantCrudService<
        IotAlarm,
        IotAlarmCreateRequest,
        IotAlarmUpdateRequest,
        IotAlarmResponse> {

    private final IotAlarmRepository repository;
    private final IotDeviceRepository deviceRepository;

    public IotAlarmService(IotAlarmRepository repository, IotDeviceRepository deviceRepository) {
        super(repository, repository, IotAlarmMapper.INSTANCE, "IoT alarm not found.");
        this.repository = repository;
        this.deviceRepository = deviceRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, IotAlarmCreateRequest request, IotAlarm entity) {
        validateDevice(tenantId, request.deviceId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, IotAlarmUpdateRequest request, IotAlarm entity) {
        validateDevice(tenantId, request.deviceId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_alarm")
    public IotAlarmResponse create(IotAlarmCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotAlarmResponse> list(
            PageRequestDto pageRequest,
            UUID deviceId,
            String severity,
            String status,
            Instant triggeredFrom,
            Instant triggeredTo
    ) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "triggeredAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        deviceId,
                        BaseSearchSpecificationBuilder.normalizeUpper(severity),
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        triggeredFrom,
                        triggeredTo,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public IotAlarmResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_alarm")
    public IotAlarmResponse update(UUID id, IotAlarmUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "iot_alarm")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_alarm_ack")
    public IotAlarmResponse acknowledge(UUID id) {
        UUID tenantId = currentTenantId();
        IotAlarm alarm = getOrThrow(id, tenantId);
        alarm.setStatus("ACKNOWLEDGED");
        alarm.setAcknowledgedAt(Instant.now());
        return IotAlarmMapper.INSTANCE.toResponse(repository.save(alarm));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "iot_alarm")
    public IotAlarmResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateDevice(UUID tenantId, UUID deviceId) {
        deviceRepository.findByIdAndTenantId(deviceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT device not found for tenant."));
    }
}
