package com.phaiffertech.platform.modules.pet.medical.prescription.repository;

import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetPrescriptionRepository
        extends JpaRepository<PetPrescription, UUID>, BaseTenantCrudRepository<PetPrescription> {

    @Query("""
            SELECT p
            FROM PetPrescription p
            WHERE p.tenantId = :tenantId
              AND (:petId IS NULL OR p.petId = :petId)
              AND (:professionalId IS NULL OR p.professionalId = :professionalId)
              AND (:search IS NULL OR
                   LOWER(p.medication) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.dosage, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.instructions, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetPrescription> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("petId") UUID petId,
            @Param("professionalId") UUID professionalId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetPrescription> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_prescriptions p
            WHERE p.id = :id
              AND p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetPrescription> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
