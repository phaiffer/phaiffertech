package com.phaiffertech.platform.modules.pet.appointment.repository;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLineInventoryPlan;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface PetAppointmentServiceLineInventoryPlanRepository
        extends JpaRepository<PetAppointmentServiceLineInventoryPlan, UUID> {

    List<PetAppointmentServiceLineInventoryPlan> findAllByTenantIdAndAppointmentServiceIdOrderByCreatedAtAsc(
            UUID tenantId,
            UUID appointmentServiceId
    );

    List<PetAppointmentServiceLineInventoryPlan> findAllByTenantIdAndAppointmentServiceIdInOrderByAppointmentServiceIdAscCreatedAtAsc(
            UUID tenantId,
            Collection<UUID> appointmentServiceIds
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PetAppointmentServiceLineInventoryPlan p
            WHERE p.id = :id
              AND p.tenantId = :tenantId
              AND p.appointmentServiceId = :appointmentServiceId
            """)
    java.util.Optional<PetAppointmentServiceLineInventoryPlan> findLockedByIdAndTenantIdAndAppointmentServiceId(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId,
            @Param("appointmentServiceId") UUID appointmentServiceId
    );
}
