package com.phaiffertech.platform.modules.iot.device.service;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
import com.phaiffertech.platform.modules.iot.device.mapper.IotDeviceMapper;
import com.phaiffertech.platform.shared.response.PageResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotDeviceService {

    private final IotDeviceRepository repository;

    public IotDeviceService(IotDeviceRepository repository) {
        this.repository = repository;
    }

    @Transactional
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
    public PageResponse<IotDeviceResponse> list(int page, int size) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<IotDevice> result = repository.findAllByTenantId(tenantId, PageRequest.of(page, size));

        return new PageResponse<>(
                result.getContent().stream().map(IotDeviceMapper::toResponse).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }
}
