package com.phaiffertech.platform.modules.pet.appointment.repository;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLine;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetAppointmentServiceLineRepository extends JpaRepository<PetAppointmentServiceLine, UUID> {

    java.util.Optional<PetAppointmentServiceLine> findByIdAndTenantIdAndAppointmentId(
            UUID id,
            UUID tenantId,
            UUID appointmentId
    );

    List<PetAppointmentServiceLine> findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(UUID tenantId, UUID appointmentId);

    List<PetAppointmentServiceLine> findAllByTenantIdAndAppointmentIdInOrderByAppointmentIdAscLineOrderAsc(
            UUID tenantId,
            Collection<UUID> appointmentIds
    );

    void deleteAllByTenantIdAndAppointmentId(UUID tenantId, UUID appointmentId);
}
