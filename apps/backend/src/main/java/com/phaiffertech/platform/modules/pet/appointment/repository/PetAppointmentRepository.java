package com.phaiffertech.platform.modules.pet.appointment.repository;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetAppointmentRepository extends JpaRepository<PetAppointment, UUID>, BaseTenantCrudRepository<PetAppointment> {

    @Query("""
            SELECT a
            FROM PetAppointment a
            WHERE a.tenantId = :tenantId
              AND (:status IS NULL OR UPPER(a.status) = UPPER(:status))
              AND (:assignedUserId IS NULL OR a.assignedUserId = :assignedUserId)
              AND (:clientId IS NULL OR a.clientId = :clientId)
              AND (:petId IS NULL OR a.petId = :petId)
              AND (:scheduledFrom IS NULL OR a.scheduledAt >= :scheduledFrom)
              AND (:scheduledTo IS NULL OR a.scheduledAt <= :scheduledTo)
              AND (:search IS NULL OR
                   LOWER(a.serviceName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(a.status, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(a.notes, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetAppointment> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("assignedUserId") UUID assignedUserId,
            @Param("clientId") UUID clientId,
            @Param("petId") UUID petId,
            @Param("scheduledFrom") Instant scheduledFrom,
            @Param("scheduledTo") Instant scheduledTo,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetAppointment> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_appointments a
            WHERE a.id = :id
              AND a.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetAppointment> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}
