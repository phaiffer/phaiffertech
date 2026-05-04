package com.phaiffertech.platform.modules.pet.plan.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ClientPlanDtos {

    public record PlanTemplateCreateDto(
        @NotBlank String commercialName,
        String description,
        @NotNull BigDecimal price,
        @NotNull @Min(1) Integer validityDays,
        @NotNull @Min(1) Integer totalSessions,
        List<UUID> serviceIds,
        String renewalRules,
        @NotNull Boolean active
    ) {}

    public record PlanTemplateUpdateDto(
        @NotBlank String commercialName,
        String description,
        @NotNull BigDecimal price,
        @NotNull @Min(1) Integer validityDays,
        @NotNull @Min(1) Integer totalSessions,
        List<UUID> serviceIds,
        String renewalRules,
        @NotNull Boolean active
    ) {}

    public record PlanTemplateResponseDto(
        UUID id,
        String commercialName,
        String description,
        BigDecimal price,
        Integer validityDays,
        Integer totalSessions,
        List<UUID> serviceIds,
        String renewalRules,
        boolean active
    ) {}

    public record ClientPlanCreateDto(
        @NotNull UUID clientId,
        @NotNull UUID petId,
        @NotNull UUID planTemplateId,
        @NotBlank String planName,
        OffsetDateTime startedAt,
        @NotNull @Min(1) Integer totalSessions,
        BigDecimal finalPrice,
        String status,
        OffsetDateTime expiresAt,
        String notes
    ) {}

    public record ClientPlanUpdateDto(
        @NotBlank String planName,
        OffsetDateTime startedAt,
        @NotNull @Min(1) Integer totalSessions,
        BigDecimal finalPrice,
        String status,
        OffsetDateTime expiresAt,
        String notes
    ) {}

    public record ClientPlanResponseDto(
        UUID id, UUID clientId, UUID petId, UUID planTemplateId, String planName,
        Integer totalSessions, Integer usedSessions, int remainingSessions,
        OffsetDateTime startedAt, OffsetDateTime expiresAt, BigDecimal finalPrice,
        String status, String renewalState, String renewalRules, String notes
    ) {}
}
