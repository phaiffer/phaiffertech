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
        appointment.setScheduledAt(request.scheduledAt());
        appointment.setServiceName(request.serviceName().trim());
        appointment.setStatus(resolveStatus(request.status()));
        appointment.setNotes(request.notes());
        appointment.setAssignedUserId(request.assignedUserId());
        return appointment;
    }

    @Override
    public void updateEntity(PetAppointment entity, PetAppointmentUpdateRequest request) {
        entity.setClientId(request.clientId());
        entity.setPetId(request.petId());
        entity.setScheduledAt(request.scheduledAt());
        entity.setServiceName(request.serviceName().trim());
        entity.setStatus(resolveStatus(request.status()));
        entity.setNotes(request.notes());
        entity.setAssignedUserId(request.assignedUserId());
    }

    @Override
    public PetAppointmentResponse toResponse(PetAppointment appointment) {
        return new PetAppointmentResponse(
                appointment.getId(),
                appointment.getClientId(),
                appointment.getPetId(),
                appointment.getScheduledAt(),
                appointment.getServiceName(),
                appointment.getStatus(),
                appointment.getNotes(),
                appointment.getAssignedUserId(),
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
