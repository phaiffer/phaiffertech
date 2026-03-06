package com.phaiffertech.platform.modules.crm.note.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.note.domain.CrmNote;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteCreateRequest;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteResponse;
import com.phaiffertech.platform.modules.crm.note.mapper.CrmNoteMapper;
import com.phaiffertech.platform.modules.crm.note.repository.CrmNoteRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
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
public class CrmNoteService {

    private final CrmNoteRepository repository;

    public CrmNoteService(CrmNoteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmNoteResponse> list(PageRequestDto pageRequest, String relatedType, UUID relatedId) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmNoteResponse> result = repository.findAllByTenantAndRelation(
                        tenantId,
                        normalize(relatedType),
                        relatedId,
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(CrmNoteMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_note")
    public CrmNoteResponse create(CrmNoteCreateRequest request) {
        CrmNote note = new CrmNote();
        note.setTenantId(TenantContext.getRequiredTenantId());
        note.setContent(request.content().trim());
        note.setRelatedType(normalize(request.relatedType()));
        note.setRelatedId(request.relatedId());
        note.setAuthorUserId(request.authorUserId());

        return CrmNoteMapper.toResponse(repository.save(note));
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }
}
