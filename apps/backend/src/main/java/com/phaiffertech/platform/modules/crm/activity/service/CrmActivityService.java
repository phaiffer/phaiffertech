package com.phaiffertech.platform.modules.crm.activity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.audit.domain.AuditLog;
import com.phaiffertech.platform.modules.crm.activity.dto.CrmActivityResponse;
import com.phaiffertech.platform.modules.crm.activity.repository.CrmActivityRepository;
import com.phaiffertech.platform.modules.crm.shared.service.CrmRelationResolverService;
import com.phaiffertech.platform.shared.contracts.crm.CrmRelatedReferenceCapability;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmActivityService {

    private final CrmActivityRepository repository;
    private final ObjectMapper objectMapper;
    private final CrmRelationResolverService relationResolverService;

    public CrmActivityService(
            CrmActivityRepository repository,
            ObjectMapper objectMapper,
            CrmRelationResolverService relationResolverService
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.relationResolverService = relationResolverService;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmActivityResponse> list(
            PageRequestDto pageRequest,
            String relatedReferenceType,
            UUID relatedId
    ) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        String normalizedRelatedReferenceType = relationResolverService.normalizeFilterReferenceType(relatedReferenceType);

        if (normalizedRelatedReferenceType == null && relatedId == null) {
            Page<CrmActivityResponse> result = repository.findCrmActivity(
                            tenantId,
                            PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"))
                    )
                    .map(this::toResponse);
            return PaginationUtils.fromPage(result);
        }

        return listFiltered(tenantId, pageRequest, normalizedRelatedReferenceType, relatedId);
    }

    private PageResponseDto<CrmActivityResponse> listFiltered(
            UUID tenantId,
            PageRequestDto pageRequest,
            String relatedReferenceType,
            UUID relatedId
    ) {
        int requestedPage = pageRequest.resolvedPage();
        int requestedSize = pageRequest.resolvedSize();
        int offset = requestedPage * requestedSize;
        int scanPage = 0;
        int scanSize = Math.max(requestedSize, 100);

        long totalMatches = 0;
        List<CrmActivityResponse> items = new ArrayList<>();

        Page<AuditLog> scannedPage;
        do {
            scannedPage = repository.findCrmActivity(
                    tenantId,
                    PageRequest.of(scanPage, scanSize, Sort.by(Sort.Direction.DESC, "createdAt"))
            );

            for (AuditLog auditLog : scannedPage.getContent()) {
                if (!matchesRelatedFilter(auditLog, relatedReferenceType, relatedId)) {
                    continue;
                }

                if (totalMatches >= offset && items.size() < requestedSize) {
                    items.add(toResponse(auditLog));
                }
                totalMatches++;
            }

            scanPage++;
        } while (scannedPage.hasNext());

        int totalPages = totalMatches == 0 ? 0 : (int) Math.ceil((double) totalMatches / requestedSize);
        return new PageResponseDto<>(items, requestedPage, requestedSize, totalMatches, totalPages);
    }

    private CrmActivityResponse toResponse(AuditLog auditLog) {
        JsonNode payload = readPayload(auditLog.getPayload());
        var entitySelection = CrmRelationResolverService.parseActivityEntity(auditLog.getEntity(), auditLog.getEntityId());
        var relatedSelection = extractRelatedSelection(payload);
        CrmRelatedReferenceCapability.ReferenceDescriptor relatedDescriptor = relatedSelection == null
                ? null
                : relationResolverService.describeRelation(auditLog.getTenantId(), relatedSelection).orElse(null);
        return new CrmActivityResponse(
                auditLog.getId(),
                resolveEventType(auditLog),
                auditLog.getEntity(),
                entitySelection.entityReferenceType(),
                entitySelection.entityModule(),
                entitySelection.entityType(),
                auditLog.getEntityId(),
                relatedSelection == null ? null : relatedSelection.relatedType(),
                relatedSelection == null ? null : relatedSelection.relatedReferenceType(),
                relatedSelection == null ? null : relatedSelection.relatedModule(),
                relatedSelection == null ? null : relatedSelection.relatedEntityType(),
                relatedSelection == null || relatedSelection.relatedId() == null ? null : relatedSelection.relatedId().toString(),
                relatedDescriptor == null ? null : relatedDescriptor.displayName(),
                relatedDescriptor == null ? null : relatedDescriptor.displayContext(),
                auditLog.getUserId(),
                payload,
                auditLog.getCreatedAt()
        );
    }

    private boolean matchesRelatedFilter(AuditLog auditLog, String relatedReferenceType, UUID relatedId) {
        JsonNode payload = readPayload(auditLog.getPayload());
        var relatedSelection = extractRelatedSelection(payload);

        if (relatedReferenceType != null) {
            if (relatedSelection == null || !relatedReferenceType.equals(relatedSelection.relatedReferenceType())) {
                return false;
            }
        }

        if (relatedId != null) {
            return relatedSelection != null && relatedId.equals(relatedSelection.relatedId());
        }

        return true;
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

    private CrmRelationResolverService.RelationSelection extractRelatedSelection(JsonNode payload) {
        JsonNode request = firstRequestArgument(payload);
        if (request == null || request.isMissingNode() || request.isNull()) {
            return null;
        }

        UUID companyId = readUuid(request, "companyId");
        UUID contactId = readUuid(request, "contactId");
        UUID leadId = readUuid(request, "leadId");
        UUID dealId = readUuid(request, "dealId");
        UUID relatedId = readUuid(request, "relatedId");

        if (companyId != null) {
            return CrmRelationResolverService.fromStored("COMPANY", companyId, companyId, null, null, null);
        }
        if (contactId != null) {
            return CrmRelationResolverService.fromStored("CONTACT", contactId, null, contactId, null, null);
        }
        if (leadId != null) {
            return CrmRelationResolverService.fromStored("LEAD", leadId, null, null, leadId, null);
        }
        if (dealId != null) {
            return CrmRelationResolverService.fromStored("DEAL", dealId, null, null, null, dealId);
        }
        if (relatedId == null) {
            return null;
        }

        String relatedReferenceType = readText(request, "relatedReferenceType");
        String relatedType = readText(request, "relatedType");
        String storedType = firstNonBlank(relatedReferenceType, relatedType);
        if (storedType == null) {
            return null;
        }

        return CrmRelationResolverService.fromStored(storedType, relatedId, null, null, null, null);
    }

    private JsonNode firstRequestArgument(JsonNode payload) {
        JsonNode arguments = payload.path("arguments");
        if (!arguments.isArray() || arguments.isEmpty()) {
            return null;
        }

        JsonNode first = arguments.get(0);
        return first != null && first.isObject() ? first : null;
    }

    private UUID readUuid(JsonNode request, String field) {
        String value = readText(request, field);
        if (value == null) {
            return null;
        }

        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private String readText(JsonNode request, String field) {
        if (request == null || request.isMissingNode() || request.isNull()) {
            return null;
        }
        JsonNode value = request.path(field);
        if (!value.isTextual()) {
            return null;
        }
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
