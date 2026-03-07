package com.phaiffertech.platform.modules.pet.appointment.mapper;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetAppointmentMapper implements BaseCrudMapper<
        PetAppointment,
        PetAppointmentCreateRequest,
        PetAppointmentUpdateRequest,
        PetAppointmentResponse> {

    public static final PetAppointmentMapper INSTANCE = new PetAppointmentMapper();

    private PetAppointmentMapper() {
    }

    @Override
    public PetAppointment toNewEntity(PetAppointmentCreateRequest request) {
        PetAppointment appointment = new PetAppointment();
        appointment.setClientId(request.clientId());
        appointment.setPetId(request.petId());
        appointment.setServiceId(request.serviceId());
        appointment.setProfessionalId(request.professionalId());
        appointment.setScheduledAt(request.scheduledAt());
        appointment.setStatus(resolveStatus(request.status()));
        appointment.setNotes(request.notes());
        return appointment;
    }

    @Override
    public void updateEntity(PetAppointment entity, PetAppointmentUpdateRequest request) {
        entity.setClientId(request.clientId());
        entity.setPetId(request.petId());
        entity.setServiceId(request.serviceId());
        entity.setProfessionalId(request.professionalId());
        entity.setScheduledAt(request.scheduledAt());
        entity.setStatus(resolveStatus(request.status()));
        entity.setNotes(request.notes());
    }

    @Override
    public PetAppointmentResponse toResponse(PetAppointment appointment) {
        return new PetAppointmentResponse(
                appointment.getId(),
                appointment.getClientId(),
                appointment.getPetId(),
                appointment.getServiceId(),
                appointment.getServiceName(),
                appointment.getProfessionalId(),
                appointment.getScheduledAt(),
                appointment.getStatus(),
                appointment.getNotes(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "SCHEDULED";
        }
        return status.trim().toUpperCase();
    }
}
