package com.phaiffertech.platform.modules.pet.plan.service;

import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.dto.ClientPlanDtos;
import com.phaiffertech.platform.modules.pet.plan.mapper.ClientPlanMapper;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.modules.pet.appointment.service.PetOperationalTriggerService;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ClientPlanService extends BaseTenantCrudService<
        ClientPlan, ClientPlanDtos.ClientPlanCreateDto, ClientPlanDtos.ClientPlanUpdateDto, ClientPlanDtos.ClientPlanResponseDto> {

    private static final Logger log = LoggerFactory.getLogger(ClientPlanService.class);

    private final ClientPlanRepository repository;
    private final PetOperationalTriggerService operationalTriggerService;

    public ClientPlanService(ClientPlanRepository repository, PetOperationalTriggerService operationalTriggerService) {
        super(repository, repository, ClientPlanMapper.INSTANCE, "Client plan not found.");
        this.repository = repository;
        this.operationalTriggerService = operationalTriggerService;
    }

    @Transactional
    public ClientPlanDtos.ClientPlanResponseDto create(ClientPlanDtos.ClientPlanCreateDto dto) {
        return doCreate(dto);
    }

    @Transactional(readOnly = true)
    public ClientPlanDtos.ClientPlanResponseDto findByIdAsDto(UUID id) {
        return doGetById(id);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<ClientPlanDtos.ClientPlanResponseDto> findAll(PageRequestDto pageRequest) {
        return findAll(pageRequest, null);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<ClientPlanDtos.ClientPlanResponseDto> findAll(PageRequestDto pageRequest, UUID clientId) {
        UUID tenantId = currentTenantId();
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> clientId != null
                        ? repository.findAllByTenantIdAndClientId(tenantId, clientId, query.pageable())
                        : repository.findAllByTenantId(tenantId, query.pageable())
        );
    }

    @Transactional
    public ClientPlanDtos.ClientPlanResponseDto update(UUID id, ClientPlanDtos.ClientPlanUpdateDto dto) {
        return doUpdate(id, dto);
    }

    @Transactional
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    public ClientPlanDtos.ClientPlanResponseDto useSession(UUID planId) {
        log.info("Attempting to use a session for plan ID: {}", planId);

        UUID tenantId = currentTenantId();
        ClientPlan plan = getOrThrow(planId, tenantId);

        if (plan.getRemainingSessions() <= 0) {
            throw new ConflictOperationException("No remaining sessions for plan: " + planId);
        }

        plan.setUsedSessions(plan.getUsedSessions() + 1);

        log.info("Successfully used a session for plan ID: {}. Used: {}, Total: {}",
                planId, plan.getUsedSessions(), plan.getTotalSessions());

        if (plan.getRemainingSessions() == 1) {
            log.warn("Last bath reminder prepared for plan ID: {}. Remaining sessions: 1", plan.getId());
            operationalTriggerService.preparePlanLastUseReminder(plan, tenantId);
        }

        return ClientPlanMapper.INSTANCE.toResponse(plan);
    }
}
