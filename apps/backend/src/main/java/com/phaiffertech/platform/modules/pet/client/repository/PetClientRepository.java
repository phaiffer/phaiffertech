package com.phaiffertech.platform.modules.pet.client.repository;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetClientRepository extends JpaRepository<PetClient, UUID> {

    @Query("""
            SELECT c
            FROM PetClient c
            WHERE c.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetClient> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );
}
