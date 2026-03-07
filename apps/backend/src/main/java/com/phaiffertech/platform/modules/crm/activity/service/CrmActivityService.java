package com.phaiffertech.platform.modules.crm.activity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.audit.domain.AuditLog;
import com.phaiffertech.platform.modules.crm.activity.dto.CrmActivityResponse;
import com.phaiffertech.platform.modules.crm.activity.repository.CrmActivityRepository;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmActivityService {

    private final CrmActivityRepository repository;
    private final ObjectMapper objectMapper;

    public CrmActivityService(CrmActivityRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmActivityResponse> list(PageRequestDto pageRequest) {
        Page<CrmActivityResponse> result = repository.findCrmActivity(
                        TenantContext.getRequiredTenantId(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(this::toResponse);
        return PaginationUtils.fromPage(result);
    }

    private CrmActivityResponse toResponse(AuditLog auditLog) {
        return new CrmActivityResponse(
                auditLog.getId(),
                resolveEventType(auditLog),
                auditLog.getEntity(),
                auditLog.getEntityId(),
                auditLog.getUserId(),
                readPayload(auditLog.getPayload()),
                auditLog.getCreatedAt()
        );
    }

    private String resolveEventType(AuditLog auditLog) {
        return switch (auditLog.getEntity()) {
            case "crm_contact" -> "contact.created";
            case "crm_lead" -> "lead.created";
            case "crm_deal" -> "deal.updated";
            case "crm_task" -> "task.created";
            case "crm_note" -> "note.created";
            default -> auditLog.getEntity() + "." + auditLog.getAction().toLowerCase();
        };
    }

    private JsonNode readPayload(String payload) {
        try {
            if (payload == null || payload.isBlank()) {
                return objectMapper.createObjectNode();
            }
            return objectMapper.readTree(payload);
        } catch (Exception ignored) {
            return objectMapper.createObjectNode();
        }
    }
}
