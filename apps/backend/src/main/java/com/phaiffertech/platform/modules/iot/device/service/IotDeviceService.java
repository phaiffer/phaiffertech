package com.phaiffertech.platform.modules.iot.device.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceUpdateRequest;
import com.phaiffertech.platform.modules.iot.device.mapper.IotDeviceMapper;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotDeviceService extends BaseTenantCrudService<
        IotDevice,
        IotDeviceCreateRequest,
        IotDeviceUpdateRequest,
        IotDeviceResponse> {

    private final IotDeviceRepository repository;

    public IotDeviceService(IotDeviceRepository repository) {
        super(repository, repository, IotDeviceMapper.INSTANCE, "IoT device not found.");
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_device")
    public IotDeviceResponse create(IotDeviceCreateRequest request) {
        return doCreate(request);
    }

    @Override
    public void beforeCreate(UUID tenantId, IotDeviceCreateRequest request, IotDevice entity) {
        validateConnection(entity);
    }

    @Override
    public void beforeUpdate(UUID tenantId, IotDeviceUpdateRequest request, IotDevice entity) {
        validateConnection(entity);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotDeviceResponse> list(PageRequestDto pageRequest, String type, String status) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        BaseSearchSpecificationBuilder.normalizeUpper(type),
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public IotDeviceResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_device")
    public IotDeviceResponse update(UUID id, IotDeviceUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "iot_device")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "iot_device")
    public IotDeviceResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateConnection(IotDevice entity) {
        if (!hasConnectionData(entity)) {
            return;
        }

        String transport = entity.getTransport();
        if (!"MODBUS_TCP".equals(transport) && !"MODBUS_RTU".equals(transport)) {
            throw new IllegalArgumentException("Device transport must be MODBUS_TCP or MODBUS_RTU.");
        }

        if (!hasText(entity.getHost())) {
            throw new IllegalArgumentException("Device host is required when Modbus connection is informed.");
        }

        if (entity.getPort() == null || entity.getPort() < 1 || entity.getPort() > 65535) {
            throw new IllegalArgumentException("Device port must be between 1 and 65535.");
        }

        if (entity.getUnitId() == null || entity.getUnitId() < 0 || entity.getUnitId() > 255) {
            throw new IllegalArgumentException("Device unitId must be between 0 and 255.");
        }
    }

    private boolean hasConnectionData(IotDevice entity) {
        return hasText(entity.getTransport())
                || hasText(entity.getHost())
                || entity.getPort() != null
                || entity.getUnitId() != null
                || hasText(entity.getPollingProfile())
                || hasText(entity.getGateway());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
