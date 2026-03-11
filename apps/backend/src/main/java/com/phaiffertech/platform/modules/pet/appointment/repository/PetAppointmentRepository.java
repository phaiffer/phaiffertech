package com.phaiffertech.platform.modules.pet.appointment.repository;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetAppointmentRepository extends JpaRepository<PetAppointment, UUID>, BaseTenantCrudRepository<PetAppointment> {

    long countByTenantIdAndDeletedAtIsNull(UUID tenantId);

    long countByTenantIdAndServiceIdIsNotNullAndProfessionalIdIsNotNullAndScheduledAtBetween(
            UUID tenantId,
            Instant scheduledFrom,
            Instant scheduledTo
    );

    long countByTenantIdAndServiceIdIsNotNullAndProfessionalIdIsNotNullAndScheduledAtGreaterThanEqual(
            UUID tenantId,
            Instant scheduledFrom
    );

    List<PetAppointment> findTop5ByTenantIdAndServiceIdIsNotNullAndProfessionalIdIsNotNullAndScheduledAtGreaterThanEqualOrderByScheduledAtAsc(
            UUID tenantId,
            Instant scheduledFrom
    );

    List<PetAppointment> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

    @Query("""
            SELECT a
            FROM PetAppointment a
            WHERE a.tenantId = :tenantId
              AND (:status IS NULL OR a.status = :status)
              AND (:professionalId IS NULL OR a.professionalId = :professionalId)
              AND (:clientId IS NULL OR a.clientId = :clientId)
              AND (:petId IS NULL OR a.petId = :petId)
              AND (:serviceId IS NULL OR a.serviceId = :serviceId)
              AND (COALESCE(:scheduledFrom, a.scheduledAt) IS NULL OR a.scheduledAt >= COALESCE(:scheduledFrom, a.scheduledAt))
              AND (COALESCE(:scheduledTo, a.scheduledAt) IS NULL OR a.scheduledAt <= COALESCE(:scheduledTo, a.scheduledAt))
              AND (:search = '%' OR
                   LOWER(a.serviceName) LIKE :search OR
                   LOWER(COALESCE(a.status, '')) LIKE :search OR
                   LOWER(COALESCE(a.notes, '')) LIKE :search)
            """)
    Page<PetAppointment> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("professionalId") UUID professionalId,
            @Param("clientId") UUID clientId,
            @Param("petId") UUID petId,
            @Param("serviceId") UUID serviceId,
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
