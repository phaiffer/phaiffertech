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
        plan.setPlanName(request.planName());
        plan.setTotalSessions(request.totalSessions());
        plan.setUsedSessions(0);
        plan.setExpiresAt(request.expiresAt());
        return plan;
    }

    @Override
    public void updateEntity(ClientPlan entity, ClientPlanDtos.ClientPlanUpdateDto request) {
        if (request.planName() != null) {
            entity.setPlanName(request.planName());
        }
        if (request.totalSessions() != null) {
            entity.setTotalSessions(request.totalSessions());
        }
        if (request.expiresAt() != null) {
            entity.setExpiresAt(request.expiresAt());
        }
    }

    @Override
    public ClientPlanDtos.ClientPlanResponseDto toResponse(ClientPlan entity) {
        return new ClientPlanDtos.ClientPlanResponseDto(
                entity.getId(),
                entity.getClientId(),
                entity.getPlanName(),
                entity.getTotalSessions(),
                entity.getUsedSessions(),
                entity.getRemainingSessions(),
                entity.getExpiresAt()
        );
    }
}