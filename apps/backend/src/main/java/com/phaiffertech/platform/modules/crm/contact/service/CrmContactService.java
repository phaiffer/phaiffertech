package com.phaiffertech.platform.modules.crm.contact.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactUpdateRequest;
import com.phaiffertech.platform.modules.crm.contact.mapper.CrmContactMapper;
import com.phaiffertech.platform.modules.crm.contact.repository.CrmContactRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmContactService extends BaseTenantCrudService<
        CrmContact,
        CrmContactCreateRequest,
        CrmContactUpdateRequest,
        CrmContactResponse> {

    private final CrmContactRepository repository;
    private final PlatformMetricsService platformMetricsService;

    public CrmContactService(CrmContactRepository repository, PlatformMetricsService platformMetricsService) {
        super(repository, repository, CrmContactMapper.INSTANCE, "Contact not found.");
        this.repository = repository;
        this.platformMetricsService = platformMetricsService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_contact")
    public CrmContactResponse create(CrmContactCreateRequest request) {
        CrmContactResponse response = doCreate(request);
        platformMetricsService.incrementCrmContactsCreated();
        return response;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmContactResponse> list(PageRequestDto pageRequest, String status, UUID ownerUserId) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        ownerUserId,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public CrmContactResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_contact")
    public CrmContactResponse update(UUID id, CrmContactUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_contact")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "crm_contact")
    public CrmContactResponse restore(UUID id) {
        return doRestore(id);
    }
}
