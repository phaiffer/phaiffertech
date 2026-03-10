package com.phaiffertech.platform.modules.crm.note.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.note.domain.CrmNote;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteCreateRequest;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteResponse;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteUpdateRequest;
import com.phaiffertech.platform.modules.crm.note.mapper.CrmNoteMapper;
import com.phaiffertech.platform.modules.crm.note.repository.CrmNoteRepository;
import com.phaiffertech.platform.modules.crm.shared.service.CrmRelationResolverService;
import com.phaiffertech.platform.shared.contracts.crm.CrmRelatedReferenceCapability;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmNoteService {

    private final CrmNoteRepository repository;
    private final CrmRelationResolverService relationResolverService;
    private final CurrentUserService currentUserService;

    public CrmNoteService(
            CrmNoteRepository repository,
            CrmRelationResolverService relationResolverService,
            CurrentUserService currentUserService
    ) {
        this.repository = repository;
        this.relationResolverService = relationResolverService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmNoteResponse> list(
            PageRequestDto pageRequest,
            String relatedReferenceType,
            UUID relatedId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId
    ) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmNoteResponse> result = repository.findAllByTenantAndRelation(
                        tenantId,
                        normalizeRelatedReferenceType(relatedReferenceType),
                        relatedId,
                        companyId,
                        contactId,
                        leadId,
                        dealId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(note -> toResponse(tenantId, note));

        return PaginationUtils.fromPage(result);
    }

    @Transactional(readOnly = true)
    public CrmNoteResponse getById(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmNote note = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found."));
        return toResponse(tenantId, note);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_note")
    public CrmNoteResponse create(CrmNoteCreateRequest request) {
        CrmNote note = new CrmNote();
        UUID tenantId = TenantContext.getRequiredTenantId();
        note.setTenantId(tenantId);
        apply(note, request.content(), request.companyId(), request.contactId(), request.leadId(), request.dealId(),
                request.relatedType(), request.relatedReferenceType(), request.relatedId());
        note.setAuthorUserId(currentUserService.getRequiredUser().userId());
        return toResponse(tenantId, repository.save(note));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_note")
    public CrmNoteResponse update(UUID id, CrmNoteUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmNote note = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found."));
        apply(note, request.content(), request.companyId(), request.contactId(), request.leadId(), request.dealId(),
                request.relatedType(), request.relatedReferenceType(), request.relatedId());
        return toResponse(tenantId, repository.save(note));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_note")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmNote note = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found."));
        note.setDeletedAt(java.time.Instant.now());
        repository.save(note);
    }

    private void apply(
            CrmNote note,
            String content,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId,
            String relatedType,
            String relatedReferenceType,
            UUID relatedId
    ) {
        var relation = relationResolverService.resolveAndValidate(
                TenantContext.getRequiredTenantId(),
                companyId,
                contactId,
                leadId,
                dealId,
                relatedType,
                relatedReferenceType,
                relatedId
        );
        note.setContent(content.trim());
        note.setRelatedType(relation.relatedReferenceType());
        note.setRelatedId(relation.relatedId());
        note.setCompanyId(relation.companyId());
        note.setContactId(relation.contactId());
        note.setLeadId(relation.leadId());
        note.setDealId(relation.dealId());
    }

    private String normalizeRelatedReferenceType(String referenceType) {
        return relationResolverService.normalizeFilterReferenceType(referenceType);
    }

    private CrmNoteResponse toResponse(UUID tenantId, CrmNote note) {
        CrmRelatedReferenceCapability.ReferenceDescriptor descriptor = relationResolverService.describeStoredRelation(
                tenantId,
                note.getRelatedType(),
                note.getRelatedId(),
                note.getCompanyId(),
                note.getContactId(),
                note.getLeadId(),
                note.getDealId()
        ).orElse(null);
        return CrmNoteMapper.toResponse(note, descriptor);
    }
}
