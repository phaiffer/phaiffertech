package com.phaiffertech.platform.modules.pet.plan.mapper;

import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.dto.ClientPlanDtos;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

// BaseCrudMapper<E, CreateReq, UpdateReq, Res>
public class ClientPlanMapper implements BaseCrudMapper<
        ClientPlan,
        ClientPlanDtos.ClientPlanCreateDto,
        ClientPlanDtos.ClientPlanUpdateDto,
        ClientPlanDtos.ClientPlanResponseDto> {

    public static final ClientPlanMapper INSTANCE = new ClientPlanMapper();

    @Override
    public ClientPlan toNewEntity(ClientPlanDtos.ClientPlanCreateDto request) {
        ClientPlan plan = new ClientPlan();
        plan.setClientId(request.clientId());
        plan.setPetId(request.petId());
        plan.setPlanTemplateId(request.planTemplateId());
        plan.setPlanName(request.planName().trim());
        plan.setTotalSessions(request.totalSessions());
        plan.setUsedSessions(0);
        plan.setStartedAt(request.startedAt());
        plan.setExpiresAt(request.expiresAt());
        plan.setFinalPrice(request.finalPrice());
        plan.setStatus(resolveStatus(request.status()));
        return plan;
    }

    @Override
    public void updateEntity(ClientPlan entity, ClientPlanDtos.ClientPlanUpdateDto request) {
        if (request.planName() != null) {
            entity.setPlanName(request.planName().trim());
        }
        if (request.totalSessions() != null) {
            entity.setTotalSessions(request.totalSessions());
        }
        if (request.startedAt() != null) {
            entity.setStartedAt(request.startedAt());
        }
        if (request.expiresAt() != null) {
            entity.setExpiresAt(request.expiresAt());
        }
        if (request.finalPrice() != null) {
            entity.setFinalPrice(request.finalPrice());
        }
        if (request.status() != null) {
            entity.setStatus(resolveStatus(request.status()));
        }
    }

    @Override
    public ClientPlanDtos.ClientPlanResponseDto toResponse(ClientPlan entity) {
        return new ClientPlanDtos.ClientPlanResponseDto(
                entity.getId(),
                entity.getClientId(),
                entity.getPetId(),
                entity.getPlanTemplateId(),
                entity.getPlanName(),
                entity.getTotalSessions(),
                entity.getUsedSessions(),
                entity.getRemainingSessions(),
                entity.getStartedAt(),
                entity.getExpiresAt(),
                entity.getFinalPrice(),
                entity.getStatus(),
                resolveRenewalState(entity),
                entity.getRenewalRules()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }

    private String resolveRenewalState(ClientPlan entity) {
        if (entity.getRemainingSessions() <= 0) {
            return "EXHAUSTED";
        }
        if (entity.getRemainingSessions() == 1) {
            return "LAST_USE";
        }
        if (entity.getRemainingSessions() == 2) {
            return "PENULTIMATE_USE";
        }
        return "HEALTHY";
    }
}
