package com.phaiffertech.platform.modules.iot.device.repository;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IotDeviceRepository extends JpaRepository<IotDevice, UUID> {

    Page<IotDevice> findAllByTenantId(UUID tenantId, Pageable pageable);
}
