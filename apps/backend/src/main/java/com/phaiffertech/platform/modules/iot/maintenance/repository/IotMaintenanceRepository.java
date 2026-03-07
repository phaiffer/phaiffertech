package com.phaiffertech.platform.modules.iot.maintenance.repository;

import com.phaiffertech.platform.modules.iot.maintenance.domain.IotMaintenance;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotMaintenanceRepository extends JpaRepository<IotMaintenance, UUID>, BaseTenantCrudRepository<IotMaintenance> {

    @Query("""
            SELECT m
            FROM IotMaintenance m
            WHERE m.tenantId = :tenantId
              AND (:deviceId IS NULL OR m.deviceId = :deviceId)
              AND (:status IS NULL OR UPPER(m.status) = UPPER(:status))
              AND (:priority IS NULL OR UPPER(m.priority) = UPPER(:priority))
              AND (:scheduledFrom IS NULL OR m.scheduledAt >= :scheduledFrom)
              AND (:scheduledTo IS NULL OR m.scheduledAt <= :scheduledTo)
              AND (:search IS NULL OR
                   LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(m.description, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(m.status, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(m.priority, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotMaintenance> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("scheduledFrom") Instant scheduledFrom,
            @Param("scheduledTo") Instant scheduledTo,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<IotMaintenance> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM iot_maintenance m
            WHERE m.id = :id
              AND m.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<IotMaintenance> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    long countByTenantIdAndStatusInAndDeletedAtIsNull(UUID tenantId, Collection<String> statuses);

    boolean existsByTenantIdAndDeviceIdAndStatusInAndDeletedAtIsNull(UUID tenantId, UUID deviceId, Collection<String> statuses);
}
