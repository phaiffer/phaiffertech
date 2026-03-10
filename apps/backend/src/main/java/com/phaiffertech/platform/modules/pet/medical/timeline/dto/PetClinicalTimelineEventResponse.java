package com.phaiffertech.platform.modules.pet.medical.timeline.dto;

import java.time.Instant;
import java.util.UUID;

public record PetClinicalTimelineEventResponse(
        String eventType,
        UUID eventId,
        Instant occurredAt,
        UUID petId,
        String petName,
        UUID professionalId,
        String professionalName,
        UUID appointmentId,
        String appointmentServiceName,
        Instant appointmentScheduledAt,
        String title,
        String summary
) {
}
