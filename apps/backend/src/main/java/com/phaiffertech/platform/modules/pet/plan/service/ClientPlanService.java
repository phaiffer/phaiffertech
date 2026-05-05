package com.phaiffertech.platform.modules.pet.plan.service;

import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.domain.PlanTemplate;
import com.phaiffertech.platform.modules.pet.plan.domain.PlanTemplateService;
import com.phaiffertech.platform.modules.pet.plan.dto.ClientPlanDtos;
import com.phaiffertech.platform.modules.pet.plan.mapper.ClientPlanMapper;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.modules.pet.plan.repository.PlanTemplateRepository;
import com.phaiffertech.platform.modules.pet.plan.repository.PlanTemplateServiceRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.appointment.service.PetOperationalTriggerService;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClientPlanService extends BaseTenantCrudService<
        ClientPlan, ClientPlanDtos.ClientPlanCreateDto, ClientPlanDtos.ClientPlanUpdateDto, ClientPlanDtos.ClientPlanResponseDto> {

    private static final Logger log = LoggerFactory.getLogger(ClientPlanService.class);

    private final ClientPlanRepository repository;
    private final PlanTemplateRepository planTemplateRepository;
    private final PlanTemplateServiceRepository planTemplateServiceRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetOperationalTriggerService operationalTriggerService;

    public ClientPlanService(
            ClientPlanRepository repository,
            PlanTemplateRepository planTemplateRepository,
            PlanTemplateServiceRepository planTemplateServiceRepository,
            PetProfileRepository petProfileRepository,
            PetOperationalTriggerService operationalTriggerService
    ) {
        super(repository, repository, ClientPlanMapper.INSTANCE, "Client plan not found.");
        this.repository = repository;
        this.planTemplateRepository = planTemplateRepository;
        this.planTemplateServiceRepository = planTemplateServiceRepository;
        this.petProfileRepository = petProfileRepository;
        this.operationalTriggerService = operationalTriggerService;
    }

    @Transactional
    public ClientPlanDtos.ClientPlanResponseDto create(ClientPlanDtos.ClientPlanCreateDto dto) {
        UUID tenantId = currentTenantId();
        PlanTemplate template = planTemplateRepository.findByIdAndTenantId(dto.planTemplateId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan template not found."));
        if (!template.isActive()) {
            throw new ConflictOperationException("Inactive plan template cannot be sold.");
        }
        PetProfile pet = petProfileRepository.findByIdAndTenantId(dto.petId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found for plan sale."));
        if (!pet.getClientId().equals(dto.clientId())) {
            throw new ConflictOperationException("Selected pet does not belong to the informed client.");
        }

        OffsetDateTime startedAt = dto.startedAt() != null ? dto.startedAt() : OffsetDateTime.now();
        OffsetDateTime expiresAt = dto.expiresAt() != null ? dto.expiresAt() : startedAt.plusDays(template.getValidityDays());
        BigDecimal finalPrice = dto.finalPrice() != null ? dto.finalPrice() : template.getPrice();

        ClientPlan plan = new ClientPlan();
        plan.setClientId(dto.clientId());
        plan.setPetId(dto.petId());
        plan.setPlanTemplateId(template.getId());
        plan.setPlanName(dto.planName() == null || dto.planName().isBlank()
                ? template.getCommercialName()
                : dto.planName().trim());
        plan.setTotalSessions(dto.totalSessions() != null ? dto.totalSessions() : template.getTotalSessions());
        plan.setUsedSessions(0);
        plan.setStartedAt(startedAt);
        plan.setExpiresAt(expiresAt);
        plan.setFinalPrice(finalPrice);
        plan.setStatus(dto.status() == null || dto.status().isBlank() ? "ACTIVE" : dto.status().trim().toUpperCase());
        plan.setRenewalRules(template.getRenewalRules());
        plan.setNotes(trimToNull(dto.notes()));
        plan.setTenantId(tenantId);
        return ClientPlanMapper.INSTANCE.toResponse(repository.save(plan));
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

    @Transactional
    public ClientPlanDtos.PlanTemplateResponseDto createTemplate(ClientPlanDtos.PlanTemplateCreateDto dto) {
        UUID tenantId = currentTenantId();
        PlanTemplate template = new PlanTemplate();
        applyTemplate(template, dto.commercialName(), dto.description(), dto.price(), dto.validityDays(),
                dto.totalSessions(), dto.renewalRules(), dto.active());
        template.setTenantId(tenantId);
        PlanTemplate saved = planTemplateRepository.save(template);
        replaceTemplateServices(tenantId, saved.getId(), dto.serviceIds());
        return toTemplateResponse(saved, dto.serviceIds());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<ClientPlanDtos.PlanTemplateResponseDto> findTemplates(
            PageRequestDto pageRequest,
            Boolean active
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"));
        var templates = active == null
                ? planTemplateRepository.findAllByTenantIdAndSearch(
                        tenantId,
                        query.search(),
                        query.pageable()
                )
                : planTemplateRepository.findAllByTenantIdAndActiveAndSearch(
                        tenantId,
                        active,
                        query.search(),
                        query.pageable()
                );
        Map<UUID, List<UUID>> serviceIdsByTemplate = loadServiceIdsByTemplate(
                tenantId,
                templates.getContent().stream().map(PlanTemplate::getId).collect(Collectors.toSet())
        );
        return PaginationUtils.fromPage(templates.map((template) -> toTemplateResponse(
                template,
                serviceIdsByTemplate.getOrDefault(template.getId(), List.of())
        )));
    }

    @Transactional
    public ClientPlanDtos.PlanTemplateResponseDto updateTemplate(UUID id, ClientPlanDtos.PlanTemplateUpdateDto dto) {
        UUID tenantId = currentTenantId();
        PlanTemplate template = planTemplateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan template not found."));
        applyTemplate(template, dto.commercialName(), dto.description(), dto.price(), dto.validityDays(),
                dto.totalSessions(), dto.renewalRules(), dto.active());
        replaceTemplateServices(tenantId, id, dto.serviceIds());
        return toTemplateResponse(template, dto.serviceIds());
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        UUID tenantId = currentTenantId();
        PlanTemplate template = planTemplateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan template not found."));
        template.setDeletedAt(java.time.Instant.now());
    }

    private void applyTemplate(
            PlanTemplate template,
            String commercialName,
            String description,
            BigDecimal price,
            Integer validityDays,
            Integer totalSessions,
            String renewalRules,
            Boolean active
    ) {
        template.setCommercialName(commercialName.trim());
        template.setDescription(trimToNull(description));
        template.setPrice(price);
        template.setValidityDays(validityDays);
        template.setTotalSessions(totalSessions);
        template.setRenewalRules(trimToNull(renewalRules));
        template.setActive(Boolean.TRUE.equals(active));
    }

    private void replaceTemplateServices(UUID tenantId, UUID templateId, List<UUID> serviceIds) {
        planTemplateServiceRepository.softDeleteByTenantIdAndPlanTemplateId(tenantId, templateId);
        if (serviceIds == null || serviceIds.isEmpty()) {
            return;
        }
        serviceIds.stream().distinct().forEach((serviceId) -> {
            PlanTemplateService link = new PlanTemplateService();
            link.setTenantId(tenantId);
            link.setPlanTemplateId(templateId);
            link.setServiceId(serviceId);
            planTemplateServiceRepository.save(link);
        });
    }

    private Map<UUID, List<UUID>> loadServiceIdsByTemplate(UUID tenantId, Set<UUID> templateIds) {
        if (templateIds.isEmpty()) {
            return Map.of();
        }
        return planTemplateServiceRepository.findAllByTenantIdAndPlanTemplateIdIn(tenantId, templateIds)
                .stream()
                .collect(Collectors.groupingBy(
                        PlanTemplateService::getPlanTemplateId,
                        Collectors.mapping(PlanTemplateService::getServiceId, Collectors.toList())
                ));
    }

    private ClientPlanDtos.PlanTemplateResponseDto toTemplateResponse(PlanTemplate template, List<UUID> serviceIds) {
        return new ClientPlanDtos.PlanTemplateResponseDto(
                template.getId(),
                template.getCommercialName(),
                template.getDescription(),
                template.getPrice(),
                template.getValidityDays(),
                template.getTotalSessions(),
                serviceIds == null ? List.of() : serviceIds,
                template.getRenewalRules(),
                template.isActive()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
