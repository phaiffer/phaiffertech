package com.phaiffertech.platform.modules.iot.telemetry.repository;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotTelemetryRecordRepository extends JpaRepository<IotTelemetryRecord, UUID> {

    @Query("""
            SELECT t
            FROM IotTelemetryRecord t
            WHERE t.tenantId = :tenantId
              AND (:deviceId IS NULL OR t.deviceId = :deviceId)
              AND (:registerId IS NULL OR t.registerId = :registerId)
              AND (:metricName IS NULL OR LOWER(t.metricName) = LOWER(:metricName))
              AND (:recordedFrom IS NULL OR t.recordedAt >= :recordedFrom)
              AND (:recordedTo IS NULL OR t.recordedAt <= :recordedTo)
              AND (:search IS NULL OR
                   LOWER(t.metricName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(t.unit, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotTelemetryRecord> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("registerId") UUID registerId,
            @Param("metricName") String metricName,
            @Param("recordedFrom") Instant recordedFrom,
            @Param("recordedTo") Instant recordedTo,
            @Param("search") String search,
            Pageable pageable
    );

    boolean existsByTenantIdAndDeviceIdAndRecordedAtAfter(UUID tenantId, UUID deviceId, Instant recordedAt);

    long countByTenantIdAndRecordedAtAfter(UUID tenantId, Instant recordedAt);

    @Query("""
            SELECT MAX(t.recordedAt)
            FROM IotTelemetryRecord t
            WHERE t.tenantId = :tenantId
              AND t.deviceId = :deviceId
            """)
    Optional<Instant> findLatestRecordedAt(@Param("tenantId") UUID tenantId, @Param("deviceId") UUID deviceId);
}
