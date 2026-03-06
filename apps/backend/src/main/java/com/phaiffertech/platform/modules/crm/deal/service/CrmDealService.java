package com.phaiffertech.platform.modules.crm.deal.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.deal.domain.CrmDeal;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealCreateRequest;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealResponse;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealUpdateRequest;
import com.phaiffertech.platform.modules.crm.deal.mapper.CrmDealMapper;
import com.phaiffertech.platform.modules.crm.deal.repository.CrmDealRepository;
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

    public CrmDealService(CrmDealRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmDealResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmDealResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
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
        apply(deal, request.title(), request.description(), request.amount(), request.status(), request.pipelineId(),
                request.stageId(), request.contactId(), request.leadId(), request.ownerUserId(), request.expectedCloseDate());

        return CrmDealMapper.toResponse(repository.save(deal));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_deal")
    public CrmDealResponse update(UUID id, CrmDealUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmDeal deal = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found."));

        apply(deal, request.title(), request.description(), request.amount(), request.status(), request.pipelineId(),
                request.stageId(), request.contactId(), request.leadId(), request.ownerUserId(), request.expectedCloseDate());

        return CrmDealMapper.toResponse(repository.save(deal));
    }

    private void apply(
            CrmDeal deal,
            String title,
            String description,
            java.math.BigDecimal amount,
            String status,
            UUID pipelineId,
            UUID stageId,
            UUID contactId,
            UUID leadId,
            UUID ownerUserId,
            java.time.LocalDate expectedCloseDate
    ) {
        deal.setTitle(title.trim());
        deal.setDescription(description);
        deal.setAmount(amount);
        deal.setStatus(resolveStatus(status));
        deal.setPipelineId(pipelineId);
        deal.setStageId(stageId);
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
}
