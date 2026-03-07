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
}
