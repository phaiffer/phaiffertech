package com.phaiffertech.platform.modules.pet.medical.vaccination.repository;

import com.phaiffertech.platform.modules.pet.medical.vaccination.domain.PetVaccination;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetVaccinationRepository
        extends JpaRepository<PetVaccination, UUID>, BaseTenantCrudRepository<PetVaccination> {

    @Query("""
            SELECT v
            FROM PetVaccination v
            WHERE v.tenantId = :tenantId
              AND (:petId IS NULL OR v.petId = :petId)
              AND (:search IS NULL OR
                   LOWER(v.vaccineName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(v.notes, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetVaccination> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("petId") UUID petId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetVaccination> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_vaccinations v
            WHERE v.id = :id
              AND v.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetVaccination> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
