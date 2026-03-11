package com.phaiffertech.platform.modules.pet.medical.prescription.repository;

import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
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

public interface PetPrescriptionRepository
        extends JpaRepository<PetPrescription, UUID>, BaseTenantCrudRepository<PetPrescription> {

    List<PetPrescription> findAllByTenantIdAndAppointmentIdIn(UUID tenantId, Collection<UUID> appointmentIds);

    List<PetPrescription> findAllByTenantIdAndPetIdOrderByCreatedAtDesc(UUID tenantId, UUID petId);

    List<PetPrescription> findAllByTenantIdAndAppointmentIdOrderByCreatedAtDesc(UUID tenantId, UUID appointmentId);

    long countByTenantIdAndAppointmentId(UUID tenantId, UUID appointmentId);

    boolean existsByTenantIdAndAppointmentId(UUID tenantId, UUID appointmentId);

    @Query("""
            SELECT p
            FROM PetPrescription p
            WHERE p.tenantId = :tenantId
              AND (:petId IS NULL OR p.petId = :petId)
              AND (:professionalId IS NULL OR p.professionalId = :professionalId)
              AND (:appointmentId IS NULL OR p.appointmentId = :appointmentId)
              AND (:search = '%' OR
                   LOWER(p.medication) LIKE :search OR
                   LOWER(COALESCE(p.dosage, '')) LIKE :search OR
                   LOWER(COALESCE(p.instructions, '')) LIKE :search)
            """)
    Page<PetPrescription> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("petId") UUID petId,
            @Param("professionalId") UUID professionalId,
            @Param("appointmentId") UUID appointmentId,
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
