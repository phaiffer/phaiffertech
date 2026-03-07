package com.phaiffertech.platform.modules.iot.telemetry.repository;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
import java.time.Instant;
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
              AND (:recordedFrom IS NULL OR t.recordedAt >= :recordedFrom)
              AND (:recordedTo IS NULL OR t.recordedAt <= :recordedTo)
              AND (:search IS NULL OR
                   LOWER(t.metricName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(t.unit, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotTelemetryRecord> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("deviceId") UUID deviceId,
            @Param("recordedFrom") Instant recordedFrom,
            @Param("recordedTo") Instant recordedTo,
            @Param("search") String search,
            Pageable pageable
    );
}
