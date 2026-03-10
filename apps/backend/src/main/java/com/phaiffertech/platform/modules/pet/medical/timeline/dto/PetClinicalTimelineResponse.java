package com.phaiffertech.platform.modules.pet.medical.timeline.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PetClinicalTimelineResponse(
        UUID petId,
        String petName,
        UUID appointmentId,
        String appointmentServiceName,
        Instant appointmentScheduledAt,
        String appointmentStatus,
        int totalEvents,
        List<PetClinicalTimelineEventResponse> events
) {
}
