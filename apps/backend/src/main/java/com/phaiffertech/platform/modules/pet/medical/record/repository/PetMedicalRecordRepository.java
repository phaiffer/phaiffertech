package com.phaiffertech.platform.modules.pet.medical.record.repository;

import com.phaiffertech.platform.modules.pet.medical.record.domain.PetMedicalRecord;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetMedicalRecordRepository
        extends JpaRepository<PetMedicalRecord, UUID>, BaseTenantCrudRepository<PetMedicalRecord> {

    @Query("""
            SELECT r
            FROM PetMedicalRecord r
            WHERE r.tenantId = :tenantId
              AND (:petId IS NULL OR r.petId = :petId)
              AND (:professionalId IS NULL OR r.professionalId = :professionalId)
              AND (:search IS NULL OR
                   LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(r.diagnosis, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(r.treatment, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetMedicalRecord> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("petId") UUID petId,
            @Param("professionalId") UUID professionalId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetMedicalRecord> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_medical_records r
            WHERE r.id = :id
              AND r.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetMedicalRecord> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
