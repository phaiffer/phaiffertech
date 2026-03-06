package com.phaiffertech.platform.modules.iot.device.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
import com.phaiffertech.platform.modules.iot.device.mapper.IotDeviceMapper;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotDeviceService {

    private final IotDeviceRepository repository;

    public IotDeviceService(IotDeviceRepository repository) {
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_device")
    public IotDeviceResponse create(IotDeviceCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        IotDevice device = new IotDevice();
        device.setTenantId(tenantId);
        device.setName(request.name());
        device.setSerialNumber(request.serialNumber());
        device.setStatus(request.status() == null || request.status().isBlank() ? "ONLINE" : request.status());
        device = repository.save(device);

        return IotDeviceMapper.toResponse(device);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotDeviceResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<IotDeviceResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(IotDeviceMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }
}
