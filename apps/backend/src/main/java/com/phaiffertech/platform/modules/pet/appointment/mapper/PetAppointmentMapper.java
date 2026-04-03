package com.phaiffertech.platform.modules.pet.appointment.mapper;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.math.BigDecimal;
import java.util.List;

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
        // servicePrice may be null here; hydrateAndValidateRelations will set it from catalog if so.
        appointment.setServicePrice(request.servicePrice());
        // Plan association — optional. planSessionConsumed defaults to false.
        appointment.setClientPlanId(request.clientPlanId());
        // Extras — optional.
        appointment.setExtrasAmount(request.extrasAmount());
        appointment.setExtrasDescription(request.extrasDescription());
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
        // servicePrice may be null here; hydrateAndValidateRelations will set it from catalog if so.
        entity.setServicePrice(request.servicePrice());
        // Plan association — allows changing or removing the plan on an appointment.
        entity.setClientPlanId(request.clientPlanId());
        // Extras — allow updating or removing.
        entity.setExtrasAmount(request.extrasAmount());
        entity.setExtrasDescription(request.extrasDescription());
    }

    @Override
    public PetAppointmentResponse toResponse(PetAppointment appointment) {
        return toResponse(appointment, null, null, null, List.of(), 0, null, null, 0, 0, 0, null);
    }

    public PetAppointmentResponse toResponse(
            PetAppointment appointment,
            String clientName,
            String petName,
            String professionalName,
            List<PetAppointmentServiceLineResponse> appointmentServices,
            int serviceCount,
            Integer totalServiceDurationMinutes,
            BigDecimal totalServiceBasePrice,
            int medicalRecordCount,
            int vaccinationCount,
            int prescriptionCount,
            Integer planRemainingSessions
    ) {
        boolean planCovered = appointment.getClientPlanId() != null && appointment.isPlanSessionConsumed();
        BigDecimal extras = appointment.getExtrasAmount() != null ? appointment.getExtrasAmount() : BigDecimal.ZERO;
        BigDecimal base = planCovered
                ? BigDecimal.ZERO
                : (appointment.getServicePrice() != null ? appointment.getServicePrice() : BigDecimal.ZERO);
        BigDecimal finalAmountDue = base.add(extras);

        return new PetAppointmentResponse(
                appointment.getId(),
                appointment.getClientId(),
                clientName,
                appointment.getPetId(),
                petName,
                appointment.getServiceId(),
                appointment.getServiceName(),
                appointmentServices,
                serviceCount,
                totalServiceDurationMinutes,
                totalServiceBasePrice,
                appointment.getProfessionalId(),
                professionalName,
                appointment.getScheduledAt(),
                appointment.getStatus(),
                appointment.getNotes(),
                medicalRecordCount,
                vaccinationCount,
                prescriptionCount,
                appointment.getCreatedAt(),
                appointment.getUpdatedAt(),
                appointment.getServicePrice(),
                appointment.getCommissionAmount(),
                appointment.getClientPlanId(),
                appointment.isPlanSessionConsumed(),
                planRemainingSessions,
                appointment.getExtrasAmount(),
                appointment.getExtrasDescription(),
                planCovered,
                finalAmountDue
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "SCHEDULED";
        }
        return status.trim().toUpperCase();
    }
}
