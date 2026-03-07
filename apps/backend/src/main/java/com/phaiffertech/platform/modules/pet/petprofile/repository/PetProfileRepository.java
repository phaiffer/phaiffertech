package com.phaiffertech.platform.modules.pet.petprofile.repository;

import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetProfileRepository extends JpaRepository<PetProfile, UUID>, BaseTenantCrudRepository<PetProfile> {

    @Query("""
            SELECT p
            FROM PetProfile p
            WHERE p.tenantId = :tenantId
              AND (:clientId IS NULL OR p.clientId = :clientId)
              AND (:search IS NULL OR
                   LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.species, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.breed, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetProfile> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("clientId") UUID clientId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetProfile> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_profiles p
            WHERE p.id = :id
              AND p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetProfile> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
