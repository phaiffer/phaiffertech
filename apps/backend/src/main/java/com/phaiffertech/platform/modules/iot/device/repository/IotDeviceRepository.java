package com.phaiffertech.platform.modules.iot.device.repository;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotDeviceRepository extends JpaRepository<IotDevice, UUID> {

    @Query("""
            SELECT d
            FROM IotDevice d
            WHERE d.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(d.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(d.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotDevice> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );
}
