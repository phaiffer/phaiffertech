package com.phaiffertech.platform.modules.crm.shared.service;

import com.phaiffertech.platform.modules.crm.company.service.CrmCompanyService;
import com.phaiffertech.platform.modules.crm.contact.repository.CrmContactRepository;
import com.phaiffertech.platform.modules.crm.deal.repository.CrmDealRepository;
import com.phaiffertech.platform.modules.crm.lead.repository.CrmLeadRepository;
import com.phaiffertech.platform.shared.contracts.crm.CrmRelatedReferenceCapability;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CrmRelationResolverService {

    private static final String CRM_MODULE = "CRM";

    private final CrmCompanyService companyService;
    private final CrmContactRepository contactRepository;
    private final CrmLeadRepository leadRepository;
    private final CrmDealRepository dealRepository;
    private final List<CrmRelatedReferenceCapability> relatedReferenceCapabilities;

    public CrmRelationResolverService(
            CrmCompanyService companyService,
            CrmContactRepository contactRepository,
            CrmLeadRepository leadRepository,
            CrmDealRepository dealRepository,
            List<CrmRelatedReferenceCapability> relatedReferenceCapabilities
    ) {
        this.companyService = companyService;
        this.contactRepository = contactRepository;
        this.leadRepository = leadRepository;
        this.dealRepository = dealRepository;
        this.relatedReferenceCapabilities = relatedReferenceCapabilities == null ? List.of() : relatedReferenceCapabilities;
    }

    public RelationSelection resolveAndValidate(
            UUID tenantId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId,
            String relatedType,
            String relatedReferenceType,
            UUID relatedId
    ) {
        RelationSelection explicit = explicitSelection(companyId, contactId, leadId, dealId);
        if (explicit != null) {
            validateExplicitCompatibility(explicit, relatedType, relatedReferenceType, relatedId);
            validate(tenantId, explicit);
            return explicit;
        }

        RelationSelection relation = genericSelection(relatedType, relatedReferenceType, relatedId);
        validate(tenantId, relation);
        return relation;
    }

    public void validateCompanyContactLead(UUID tenantId, UUID companyId, UUID contactId, UUID leadId) {
        if (companyId != null) {
            companyService.requireActiveCompany(tenantId, companyId);
        }

        if (contactId != null && contactRepository.findByIdAndTenantId(contactId, tenantId).isEmpty()) {
            throw new ResourceNotFoundException("Contact not found.");
        }

        if (leadId != null && leadRepository.findByIdAndTenantId(leadId, tenantId).isEmpty()) {
            throw new ResourceNotFoundException("Lead not found.");
        }
    }

    public Optional<CrmRelatedReferenceCapability.ReferenceDescriptor> describeStoredRelation(
            UUID tenantId,
            String relatedType,
            UUID relatedId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId
    ) {
        return describeRelation(tenantId, fromStored(relatedType, relatedId, companyId, contactId, leadId, dealId));
    }

    public Optional<CrmRelatedReferenceCapability.ReferenceDescriptor> describeRelation(
            UUID tenantId,
            RelationSelection relation
    ) {
        if (relation == null || relation.relatedReferenceType() == null || relation.relatedId() == null) {
            return Optional.empty();
        }

        return findCapability(relation.relatedReferenceType())
                .flatMap(capability -> capability.describeReference(tenantId, relation.relatedReferenceType(), relation.relatedId()));
    }

    private RelationSelection explicitSelection(UUID companyId, UUID contactId, UUID leadId, UUID dealId) {
        int count = countNonNull(companyId, contactId, leadId, dealId);
        if (count == 0) {
            return null;
        }
        if (count > 1) {
            throw new IllegalArgumentException("Exactly one CRM relation must be provided.");
        }

        if (companyId != null) {
            return RelationSelection.crm("COMPANY", CRM_MODULE + ".COMPANY", companyId, companyId, null, null, null);
        }
        if (contactId != null) {
            return RelationSelection.crm("CONTACT", CRM_MODULE + ".CONTACT", contactId, null, contactId, null, null);
        }
        if (leadId != null) {
            return RelationSelection.crm("LEAD", CRM_MODULE + ".LEAD", leadId, null, null, leadId, null);
        }
        return RelationSelection.crm("DEAL", CRM_MODULE + ".DEAL", dealId, null, null, null, dealId);
    }

    private void validateExplicitCompatibility(
            RelationSelection explicit,
            String relatedType,
            String relatedReferenceType,
            UUID relatedId
    ) {
        if (relatedId != null && !relatedId.equals(explicit.relatedId())) {
            throw new IllegalArgumentException("Explicit CRM relation does not match relatedId.");
        }

        if ((relatedType == null || relatedType.isBlank()) && (relatedReferenceType == null || relatedReferenceType.isBlank())) {
            return;
        }

        ReferenceDescriptor descriptor = parseReferenceDescriptor(relatedType, relatedReferenceType);
        if (!explicit.relatedReferenceType().equals(descriptor.referenceType())) {
            throw new IllegalArgumentException("Explicit CRM relation does not match relatedType.");
        }
    }

    private RelationSelection genericSelection(String relatedType, String relatedReferenceType, UUID relatedId) {
        if (relatedId == null) {
            throw new IllegalArgumentException("A CRM relation is required.");
        }

        ReferenceDescriptor descriptor = parseReferenceDescriptor(relatedType, relatedReferenceType);

        if (!descriptor.isCrmRelation()) {
            return RelationSelection.external(
                    descriptor.compatibilityType(),
                    descriptor.referenceType(),
                    descriptor.moduleCode(),
                    descriptor.entityType(),
                    relatedId
            );
        }

        return switch (descriptor.entityType()) {
            case "COMPANY" -> RelationSelection.crm(descriptor.compatibilityType(), descriptor.referenceType(), relatedId, relatedId, null, null, null);
            case "CONTACT" -> RelationSelection.crm(descriptor.compatibilityType(), descriptor.referenceType(), relatedId, null, relatedId, null, null);
            case "LEAD" -> RelationSelection.crm(descriptor.compatibilityType(), descriptor.referenceType(), relatedId, null, null, relatedId, null);
            case "DEAL" -> RelationSelection.crm(descriptor.compatibilityType(), descriptor.referenceType(), relatedId, null, null, null, relatedId);
            default -> throw new IllegalArgumentException("Unsupported CRM relation type: " + descriptor.entityType());
        };
    }

    private ReferenceDescriptor parseReferenceDescriptor(String relatedType, String relatedReferenceType) {
        String raw = firstNonBlank(relatedReferenceType, relatedType);
        if (raw == null) {
            throw new IllegalArgumentException("A CRM relation is required.");
        }

        String normalized = normalizeToken(raw);
        if (!normalized.contains(".")) {
            if (!isSupportedCrmEntity(normalized)) {
                throw new IllegalArgumentException("Unsupported CRM relation type: " + raw);
            }
            return new ReferenceDescriptor(normalized, CRM_MODULE + "." + normalized, CRM_MODULE, normalized, true);
        }

        String[] parts = normalized.split("\\.", 2);
        String moduleCode = normalizeToken(parts[0]);
        String entityType = normalizeToken(parts[1]);
        if (moduleCode == null || entityType == null) {
            throw new IllegalArgumentException("Invalid relation reference type: " + raw);
        }

        if (CRM_MODULE.equals(moduleCode) && !isSupportedCrmEntity(entityType)) {
            throw new IllegalArgumentException("Unsupported CRM relation type: " + raw);
        }

        return new ReferenceDescriptor(
                CRM_MODULE.equals(moduleCode) ? entityType : moduleCode + "." + entityType,
                moduleCode + "." + entityType,
                moduleCode,
                entityType,
                CRM_MODULE.equals(moduleCode)
        );
    }

    private void validate(UUID tenantId, RelationSelection relation) {
        switch (relation.relatedReferenceType()) {
            case "CRM.COMPANY" -> companyService.requireActiveCompany(tenantId, relation.relatedId());
            case "CRM.CONTACT" -> contactRepository.findByIdAndTenantId(relation.relatedId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));
            case "CRM.LEAD" -> leadRepository.findByIdAndTenantId(relation.relatedId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found."));
            case "CRM.DEAL" -> dealRepository.findByIdAndTenantId(relation.relatedId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Deal not found."));
            default -> findCapability(relation.relatedReferenceType())
                    .ifPresent(capability -> capability.validateReference(tenantId, relation.relatedReferenceType(), relation.relatedId()));
        }
    }

    private Optional<CrmRelatedReferenceCapability> findCapability(String referenceType) {
        String normalizedReference = normalizeToken(referenceType);
        if (normalizedReference == null) {
            return Optional.empty();
        }

        return relatedReferenceCapabilities.stream()
                .filter(capability -> capability.supports(normalizedReference))
                .findFirst();
    }

    public static RelationSelection fromStored(
            String relatedType,
            UUID relatedId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId
    ) {
        ReferenceDescriptor descriptor = parseStoredReferenceDescriptor(relatedType);
        UUID resolvedCompanyId = companyId != null ? companyId : ("CRM.COMPANY".equals(descriptor.referenceType()) ? relatedId : null);
        UUID resolvedContactId = contactId != null ? contactId : ("CRM.CONTACT".equals(descriptor.referenceType()) ? relatedId : null);
        UUID resolvedLeadId = leadId != null ? leadId : ("CRM.LEAD".equals(descriptor.referenceType()) ? relatedId : null);
        UUID resolvedDealId = dealId != null ? dealId : ("CRM.DEAL".equals(descriptor.referenceType()) ? relatedId : null);

        if (descriptor.isCrmRelation()) {
            return RelationSelection.crm(
                    descriptor.compatibilityType(),
                    descriptor.referenceType(),
                    relatedId,
                    resolvedCompanyId,
                    resolvedContactId,
                    resolvedLeadId,
                    resolvedDealId
            );
        }

        return RelationSelection.external(
                descriptor.compatibilityType(),
                descriptor.referenceType(),
                descriptor.moduleCode(),
                descriptor.entityType(),
                relatedId
        );
    }

    public static EntitySelection parseActivityEntity(String entity, String entityId) {
        if (entity == null || entity.isBlank()) {
            return new EntitySelection(entity, null, null, null, entityId);
        }

        String normalized = entity.trim().toUpperCase();
        int separatorIndex = normalized.indexOf('_');
        if (separatorIndex < 0 || separatorIndex == normalized.length() - 1) {
            return new EntitySelection(entity, normalized, null, normalized, entityId);
        }

        String moduleCode = normalizeToken(normalized.substring(0, separatorIndex));
        String entityType = normalizeToken(normalized.substring(separatorIndex + 1));
        return new EntitySelection(entity, moduleCode + "." + entityType, moduleCode, entityType, entityId);
    }

    private static ReferenceDescriptor parseStoredReferenceDescriptor(String relatedType) {
        String normalized = normalizeToken(relatedType);
        if (normalized == null) {
            throw new IllegalArgumentException("Stored relation type is required.");
        }

        if (!normalized.contains(".")) {
            if (!isSupportedCrmEntity(normalized)) {
                return new ReferenceDescriptor(normalized, normalized, null, null, false);
            }
            return new ReferenceDescriptor(normalized, CRM_MODULE + "." + normalized, CRM_MODULE, normalized, true);
        }

        String[] parts = normalized.split("\\.", 2);
        String moduleCode = normalizeToken(parts[0]);
        String entityType = normalizeToken(parts[1]);
        boolean crmRelation = CRM_MODULE.equals(moduleCode) && isSupportedCrmEntity(entityType);
        return new ReferenceDescriptor(
                crmRelation ? entityType : moduleCode + "." + entityType,
                moduleCode + "." + entityType,
                moduleCode,
                entityType,
                crmRelation
        );
    }

    private static boolean isSupportedCrmEntity(String entityType) {
        return "COMPANY".equals(entityType)
                || "CONTACT".equals(entityType)
                || "LEAD".equals(entityType)
                || "DEAL".equals(entityType);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalizeToken(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private static String normalizeToken(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim()
                .toUpperCase()
                .replace(':', '.')
                .replace('-', '_')
                .replace(' ', '_');
    }

    private int countNonNull(Object... values) {
        int count = 0;
        for (Object value : values) {
            if (value != null) {
                count++;
            }
        }
        return count;
    }

    public record RelationSelection(
            String relatedType,
            String relatedReferenceType,
            String relatedModule,
            String relatedEntityType,
            UUID relatedId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId
    ) {

        public static RelationSelection crm(
                String relatedType,
                String relatedReferenceType,
                UUID relatedId,
                UUID companyId,
                UUID contactId,
                UUID leadId,
                UUID dealId
        ) {
            return new RelationSelection(relatedType, relatedReferenceType, CRM_MODULE, relatedType, relatedId, companyId, contactId, leadId, dealId);
        }

        public static RelationSelection external(
                String relatedType,
                String relatedReferenceType,
                String relatedModule,
                String relatedEntityType,
                UUID relatedId
        ) {
            return new RelationSelection(relatedType, relatedReferenceType, relatedModule, relatedEntityType, relatedId, null, null, null, null);
        }
    }

    private record ReferenceDescriptor(
            String compatibilityType,
            String referenceType,
            String moduleCode,
            String entityType,
            boolean isCrmRelation
    ) {
    }

    public record EntitySelection(
            String rawEntity,
            String entityReferenceType,
            String entityModule,
            String entityType,
            String entityId
    ) {
    }
}
