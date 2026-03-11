package com.phaiffertech.platform.modules.iot.alarm.repository;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
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
              AND (:registerId IS NULL OR a.registerId = :registerId)
              AND (:severity IS NULL OR a.severity = :severity)
              AND (:status IS NULL OR a.status = :status)
              AND (COALESCE(:triggeredFrom, a.triggeredAt) IS NULL OR a.triggeredAt >= COALESCE(:triggeredFrom, a.triggeredAt))
              AND (COALESCE(:triggeredTo, a.triggeredAt) IS NULL OR a.triggeredAt <= COALESCE(:triggeredTo, a.triggeredAt))
              AND (:search = '%' OR
                   LOWER(COALESCE(a.code, '')) LIKE :search OR
                   LOWER(COALESCE(a.message, '')) LIKE :search OR
                   LOWER(COALESCE(a.severity, '')) LIKE :search OR
                   LOWER(COALESCE(a.status, '')) LIKE :search)
            """)
    Page<IotAlarm> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("registerId") UUID registerId,
            @Param("severity") String severity,
            @Param("status") String status,
            @Param("triggeredFrom") Instant triggeredFrom,
            @Param("triggeredTo") Instant triggeredTo,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<IotAlarm> findByIdAndTenantId(UUID id, UUID tenantId);

    List<IotAlarm> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

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

    boolean existsByTenantIdAndDeviceIdAndSeverityAndStatusIn(
            UUID tenantId,
            UUID deviceId,
            String severity,
            Iterable<String> statuses
    );

    boolean existsByTenantIdAndDeviceIdAndSeverityInAndStatusIn(
            UUID tenantId,
            UUID deviceId,
            Collection<String> severities,
            Collection<String> statuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM IotAlarm a
            WHERE a.tenantId = :tenantId
              AND a.deviceId = :deviceId
              AND ((:registerId IS NULL AND a.registerId IS NULL) OR a.registerId = :registerId)
              AND a.code = :code
              AND a.status IN :statuses
            """)
    boolean existsOpenAlarm(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("registerId") UUID registerId,
            @Param("code") String code,
            @Param("statuses") Iterable<String> statuses
    );

    @Query("""
            SELECT a
            FROM IotAlarm a
            WHERE a.tenantId = :tenantId
              AND a.deviceId = :deviceId
              AND ((:registerId IS NULL AND a.registerId IS NULL) OR a.registerId = :registerId)
              AND a.code IN :codes
              AND a.status IN :statuses
            ORDER BY a.triggeredAt DESC
            """)
    List<IotAlarm> findOpenAlarmsByCodes(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("registerId") UUID registerId,
            @Param("codes") Collection<String> codes,
            @Param("statuses") Collection<String> statuses
    );

    List<IotAlarm> findTop5ByTenantIdOrderByTriggeredAtDesc(UUID tenantId);

    List<IotAlarm> findTop5ByTenantIdAndSeverityInAndStatusInOrderByTriggeredAtDesc(
            UUID tenantId,
            Collection<String> severities,
            Collection<String> statuses
    );
}
