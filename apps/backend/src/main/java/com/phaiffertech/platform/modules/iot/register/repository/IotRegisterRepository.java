package com.phaiffertech.platform.modules.iot.register.repository;

import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotRegisterRepository extends JpaRepository<IotRegister, UUID>, BaseTenantCrudRepository<IotRegister> {

    @Query("""
            SELECT r
            FROM IotRegister r
            WHERE r.tenantId = :tenantId
              AND (:deviceId IS NULL OR r.deviceId = :deviceId)
              AND (:metricName IS NULL OR LOWER(r.metricName) = LOWER(:metricName))
              AND (:status IS NULL OR UPPER(r.status) = UPPER(:status))
              AND (:search IS NULL OR
                   LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(r.metricName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(r.unit, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(r.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotRegister> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("metricName") String metricName,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<IotRegister> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndDeviceIdAndCodeIgnoreCaseAndDeletedAtIsNull(UUID tenantId, UUID deviceId, String code);

    boolean existsByTenantIdAndDeviceIdAndCodeIgnoreCaseAndIdNotAndDeletedAtIsNull(
            UUID tenantId,
            UUID deviceId,
            String code,
            UUID id
    );

    long countByTenantId(UUID tenantId);

    @Query(value = """
            SELECT *
            FROM iot_registers r
            WHERE r.id = :id
              AND r.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<IotRegister> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
