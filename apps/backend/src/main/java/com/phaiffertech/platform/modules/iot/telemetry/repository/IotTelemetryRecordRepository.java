package com.phaiffertech.platform.modules.iot.telemetry.repository;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;
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
              AND (:search IS NULL OR
                   LOWER(t.metric) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IotTelemetryRecord> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );
}
