package com.phaiffertech.platform.modules.iot.register.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterCreateRequest;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterResponse;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterUpdateRequest;
import com.phaiffertech.platform.modules.iot.register.mapper.IotRegisterMapper;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotRegisterService extends BaseTenantCrudService<
        IotRegister,
        IotRegisterCreateRequest,
        IotRegisterUpdateRequest,
        IotRegisterResponse> {

    private final IotRegisterRepository repository;
    private final IotDeviceRepository deviceRepository;

    public IotRegisterService(IotRegisterRepository repository, IotDeviceRepository deviceRepository) {
        super(repository, repository, IotRegisterMapper.INSTANCE, "IoT register not found.");
        this.repository = repository;
        this.deviceRepository = deviceRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, IotRegisterCreateRequest request, IotRegister entity) {
        validateDevice(tenantId, entity.getDeviceId());
        validateThresholds(entity.getMinThreshold(), entity.getMaxThreshold());
        ensureUniqueCode(tenantId, entity.getDeviceId(), entity.getCode(), null);
    }

    @Override
    public void beforeUpdate(UUID tenantId, IotRegisterUpdateRequest request, IotRegister entity) {
        validateDevice(tenantId, entity.getDeviceId());
        validateThresholds(entity.getMinThreshold(), entity.getMaxThreshold());
        ensureUniqueCode(tenantId, entity.getDeviceId(), entity.getCode(), entity.getId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_register")
    public IotRegisterResponse create(IotRegisterCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotRegisterResponse> list(
            PageRequestDto pageRequest,
            UUID deviceId,
            String metricName,
            String status
    ) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.ASC, "name"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        deviceId,
                        normalizeMetric(metricName),
                        normalizeUpper(status),
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public IotRegisterResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_register")
    public IotRegisterResponse update(UUID id, IotRegisterUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "iot_register")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "iot_register")
    public IotRegisterResponse restore(UUID id) {
        return doRestore(id);
    }

    @Transactional(readOnly = true)
    public IotRegister requireForTenant(UUID tenantId, UUID registerId) {
        return repository.findByIdAndTenantId(registerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT register not found for tenant."));
    }

    private void validateDevice(UUID tenantId, UUID deviceId) {
        deviceRepository.findByIdAndTenantId(deviceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT device not found for tenant."));
    }

    private void validateThresholds(BigDecimal minThreshold, BigDecimal maxThreshold) {
        if (minThreshold != null && maxThreshold != null && minThreshold.compareTo(maxThreshold) > 0) {
            throw new IllegalArgumentException("Register min threshold cannot be greater than max threshold.");
        }
    }

    private void ensureUniqueCode(UUID tenantId, UUID deviceId, String code, UUID registerId) {
        boolean exists = registerId == null
                ? repository.existsByTenantIdAndDeviceIdAndCodeIgnoreCaseAndDeletedAtIsNull(tenantId, deviceId, code)
                : repository.existsByTenantIdAndDeviceIdAndCodeIgnoreCaseAndIdNotAndDeletedAtIsNull(
                        tenantId,
                        deviceId,
                        code,
                        registerId
                );
        if (exists) {
            throw new IllegalArgumentException("Register code already exists for the selected device.");
        }
    }

    private String normalizeUpper(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private String normalizeMetric(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase();
    }
}
