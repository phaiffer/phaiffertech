package com.phaiffertech.platform.modules.pet.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetAppointmentCreateRequest(
        @NotNull UUID clientId,
        @NotNull UUID petId,
        @NotNull UUID serviceId,
        @NotNull UUID professionalId,
        @NotNull Instant scheduledAt,
        String status,
        String notes,
        // Optional price override. If null, service price is auto-populated from the catalog.
        BigDecimal servicePrice,
        // Optional: associate this appointment with a client plan for session tracking.
        UUID clientPlanId,
        // Optional extras (e.g. pet taxi, grooming add-ons).
        BigDecimal extrasAmount,
        String extrasDescription
) {
}
