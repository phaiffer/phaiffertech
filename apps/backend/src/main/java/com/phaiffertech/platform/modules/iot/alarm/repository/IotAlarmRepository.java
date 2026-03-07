package com.phaiffertech.platform.modules.iot.alarm.repository;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotAlarmRepository extends JpaRepository<IotAlarm, UUID>, BaseTenantCrudRepository<IotAlarm> {

    @Query("""
            SELECT a
            FROM IotAlarm a
            WHERE a.tenantId = :tenantId
              AND (:deviceId IS NULL OR a.deviceId = :deviceId)
              AND (:severity IS NULL OR UPPER(a.severity) = UPPER(:severity))
              AND (:status IS NULL OR UPPER(a.status) = UPPER(:status))
              AND (:triggeredFrom IS NULL OR a.triggeredAt >= :triggeredFrom)
              AND (:triggeredTo IS NULL OR a.triggeredAt <= :triggeredTo)
              AND (:search IS NULL OR
                   LOWER(COALESCE(a.code, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(a.message, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(a.severity, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(a.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotAlarm> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("severity") String severity,
            @Param("status") String status,
            @Param("triggeredFrom") Instant triggeredFrom,
            @Param("triggeredTo") Instant triggeredTo,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<IotAlarm> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM iot_alarms a
            WHERE a.id = :id
              AND a.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<IotAlarm> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
