package com.phaiffertech.platform.modules.crm.deal.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.company.service.CrmCompanyService;
import com.phaiffertech.platform.modules.crm.contact.repository.CrmContactRepository;
import com.phaiffertech.platform.modules.crm.deal.domain.CrmDeal;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealCreateRequest;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealResponse;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealUpdateRequest;
import com.phaiffertech.platform.modules.crm.deal.mapper.CrmDealMapper;
import com.phaiffertech.platform.modules.crm.deal.repository.CrmDealRepository;
import com.phaiffertech.platform.modules.crm.lead.repository.CrmLeadRepository;
import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipelineStage;
import com.phaiffertech.platform.modules.crm.pipeline.repository.CrmPipelineStageRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmDealService {

    private final CrmDealRepository repository;
    private final CrmCompanyService companyService;
    private final CrmContactRepository contactRepository;
    private final CrmLeadRepository leadRepository;
    private final CrmPipelineStageRepository pipelineStageRepository;

    public CrmDealService(
            CrmDealRepository repository,
            CrmCompanyService companyService,
            CrmContactRepository contactRepository,
            CrmLeadRepository leadRepository,
            CrmPipelineStageRepository pipelineStageRepository
    ) {
        this.repository = repository;
        this.companyService = companyService;
        this.contactRepository = contactRepository;
        this.leadRepository = leadRepository;
        this.pipelineStageRepository = pipelineStageRepository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmDealResponse> list(
            PageRequestDto pageRequest,
            String status,
            UUID companyId,
            UUID pipelineStageId,
            UUID ownerUserId
    ) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmDealResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        normalizeUpper(status),
                        companyId,
                        pipelineStageId,
                        ownerUserId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(CrmDealMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_deal")
    public CrmDealResponse create(CrmDealCreateRequest request) {
        CrmDeal deal = new CrmDeal();
        deal.setTenantId(TenantContext.getRequiredTenantId());
        apply(deal, request.title(), request.description(), request.amount(), request.currency(), request.status(),
                request.companyId(), request.pipelineStageId(), request.contactId(), request.leadId(),
                request.ownerUserId(), request.expectedCloseDate());

        return CrmDealMapper.toResponse(repository.save(deal));
    }

    @Transactional(readOnly = true)
    public CrmDealResponse getById(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        return CrmDealMapper.toResponse(repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found.")));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_deal")
    public CrmDealResponse update(UUID id, CrmDealUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmDeal deal = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found."));

        apply(deal, request.title(), request.description(), request.amount(), request.currency(), request.status(),
                request.companyId(), request.pipelineStageId(), request.contactId(), request.leadId(),
                request.ownerUserId(), request.expectedCloseDate());

        return CrmDealMapper.toResponse(repository.save(deal));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_deal")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmDeal deal = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found."));
        deal.setDeletedAt(java.time.Instant.now());
        repository.save(deal);
    }

    private void apply(
            CrmDeal deal,
            String title,
            String description,
            java.math.BigDecimal amount,
            String currency,
            String status,
            UUID companyId,
            UUID pipelineStageId,
            UUID contactId,
            UUID leadId,
            UUID ownerUserId,
            java.time.LocalDate expectedCloseDate
    ) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        companyService.requireActiveCompany(tenantId, companyId);
        CrmPipelineStage stage = pipelineStageRepository.findByIdAndTenantId(pipelineStageId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline stage not found."));

        if (contactId != null) {
            var contact = contactRepository.findByIdAndTenantId(contactId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));
            if (contact.getCompanyId() != null && !contact.getCompanyId().equals(companyId)) {
                throw new IllegalArgumentException("Deal company must match the selected contact company.");
            }
        }

        if (leadId != null) {
            var lead = leadRepository.findByIdAndTenantId(leadId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found."));
            if (lead.getCompanyId() != null && !lead.getCompanyId().equals(companyId)) {
                throw new IllegalArgumentException("Deal company must match the selected lead company.");
            }
        }

        deal.setTitle(title.trim());
        deal.setDescription(normalize(description));
        deal.setAmount(amount);
        deal.setCurrency(resolveCurrency(currency));
        deal.setStatus(resolveStatus(status));
        deal.setPipelineId(stage.getPipelineId());
        deal.setPipelineStageId(pipelineStageId);
        deal.setCompanyId(companyId);
        deal.setContactId(contactId);
        deal.setLeadId(leadId);
        deal.setOwnerUserId(ownerUserId);
        deal.setExpectedCloseDate(expectedCloseDate);
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "OPEN";
        }
        return status.trim().toUpperCase();
    }

    private String resolveCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "BRL";
        }
        return currency.trim().toUpperCase();
    }

    private String normalizeUpper(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toUpperCase();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
