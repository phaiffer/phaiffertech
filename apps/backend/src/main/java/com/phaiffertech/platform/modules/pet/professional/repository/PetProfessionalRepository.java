package com.phaiffertech.platform.modules.pet.professional.repository;

import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetProfessionalRepository
        extends JpaRepository<PetProfessional, UUID>, BaseTenantCrudRepository<PetProfessional> {

    @Query("""
            SELECT p
            FROM PetProfessional p
            WHERE p.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.specialty, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.licenseNumber, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetProfessional> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetProfessional> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_professionals p
            WHERE p.id = :id
              AND p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetProfessional> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
