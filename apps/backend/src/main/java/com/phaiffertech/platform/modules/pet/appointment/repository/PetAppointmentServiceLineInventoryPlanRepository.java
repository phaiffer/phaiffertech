package com.phaiffertech.platform.modules.pet.appointment.repository;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLineInventoryPlan;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
