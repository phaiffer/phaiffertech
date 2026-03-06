package com.phaiffertech.platform.modules.pet.appointment.repository;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetAppointmentRepository extends JpaRepository<PetAppointment, UUID> {
}
