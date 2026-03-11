package com.phaiffertech.platform.modules.iot.device.repository;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotDeviceRepository extends JpaRepository<IotDevice, UUID>, BaseTenantCrudRepository<IotDevice> {

    Optional<IotDevice> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<IotDevice> findByTenantIdAndIdentifierIgnoreCaseAndDeletedAtIsNull(UUID tenantId, String identifier);

    @Query("""
            SELECT d
            FROM IotDevice d
            WHERE d.tenantId = :tenantId
              AND (:type IS NULL OR COALESCE(d.type, '') = :type)
              AND (:status IS NULL OR d.status = :status)
              AND (:search = '%' OR
                   LOWER(d.name) LIKE :search OR
                   LOWER(d.identifier) LIKE :search OR
                   LOWER(COALESCE(d.location, '')) LIKE :search OR
                   LOWER(COALESCE(d.description, '')) LIKE :search OR
                   LOWER(COALESCE(d.status, '')) LIKE :search)
            """)
    Page<IotDevice> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("type") String type,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
            SELECT *
            FROM iot_devices d
            WHERE d.id = :id
              AND d.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<IotDevice> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    List<IotDevice> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
