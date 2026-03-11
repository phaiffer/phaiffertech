package com.phaiffertech.platform.modules.pet.client.repository;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetClientRepository extends JpaRepository<PetClient, UUID>, BaseTenantCrudRepository<PetClient> {

    long countByTenantIdAndDeletedAtIsNull(UUID tenantId);

    @Query("""
            SELECT c
            FROM PetClient c
            WHERE c.tenantId = :tenantId
              AND (:status IS NULL OR c.status = :status)
              AND (:search = '%' OR
                   LOWER(c.name) LIKE :search OR
                   LOWER(COALESCE(c.email, '')) LIKE :search OR
                   LOWER(COALESCE(c.phone, '')) LIKE :search OR
                   LOWER(COALESCE(c.document, '')) LIKE :search OR
                   LOWER(COALESCE(c.address, '')) LIKE :search)
            """)
    Page<PetClient> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetClient> findByIdAndTenantId(UUID id, UUID tenantId);

    List<PetClient> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

    @Query(value = """
            SELECT *
            FROM pet_clients c
            WHERE c.id = :id
              AND c.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetClient> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
