package com.phaiffertech.platform.modules.crm.lead.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.lead.domain.CrmLead;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadCreateRequest;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadResponse;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadUpdateRequest;
import com.phaiffertech.platform.modules.crm.lead.mapper.CrmLeadMapper;
import com.phaiffertech.platform.modules.crm.lead.repository.CrmLeadRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmLeadService extends BaseTenantCrudService<
        CrmLead,
        CrmLeadCreateRequest,
        CrmLeadUpdateRequest,
        CrmLeadResponse> {

    private final CrmLeadRepository repository;

    public CrmLeadService(CrmLeadRepository repository) {
        super(repository, repository, CrmLeadMapper.INSTANCE, "Lead not found.");
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_lead")
    public CrmLeadResponse create(CrmLeadCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmLeadResponse> list(
            PageRequestDto pageRequest,
            String status,
            String source,
            UUID assignedUserId
    ) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        BaseSearchSpecificationBuilder.normalizeUpper(source),
                        assignedUserId,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public CrmLeadResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_lead")
    public CrmLeadResponse update(UUID id, CrmLeadUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_lead")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "crm_lead")
    public CrmLeadResponse restore(UUID id) {
        return doRestore(id);
    }
}
