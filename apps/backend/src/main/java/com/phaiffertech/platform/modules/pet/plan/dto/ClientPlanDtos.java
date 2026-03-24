package com.phaiffertech.platform.modules.pet.plan.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ClientPlanDtos {

    public record ClientPlanCreateDto(
        @NotNull UUID clientId,
        @NotBlank String planName,
        @NotNull @Min(1) Integer totalSessions,
        OffsetDateTime expiresAt
    ) {}

    public record ClientPlanUpdateDto(
        @NotBlank String planName,
        @NotNull @Min(1) Integer totalSessions,
        OffsetDateTime expiresAt
    ) {}

    public record ClientPlanResponseDto(
        UUID id, UUID clientId, String planName, Integer totalSessions,
        Integer usedSessions, int remainingSessions, OffsetDateTime expiresAt
    ) {}
}