package com.phaiffertech.platform.modules.crm.shared.service;

import com.phaiffertech.platform.modules.crm.company.service.CrmCompanyService;
import com.phaiffertech.platform.modules.crm.contact.repository.CrmContactRepository;
import com.phaiffertech.platform.modules.crm.deal.repository.CrmDealRepository;
import com.phaiffertech.platform.modules.crm.lead.repository.CrmLeadRepository;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CrmRelationResolverService {

    private final CrmCompanyService companyService;
    private final CrmContactRepository contactRepository;
    private final CrmLeadRepository leadRepository;
    private final CrmDealRepository dealRepository;

    public CrmRelationResolverService(
            CrmCompanyService companyService,
            CrmContactRepository contactRepository,
            CrmLeadRepository leadRepository,
            CrmDealRepository dealRepository
    ) {
        this.companyService = companyService;
        this.contactRepository = contactRepository;
        this.leadRepository = leadRepository;
        this.dealRepository = dealRepository;
    }

    public RelationSelection resolveAndValidate(
            UUID tenantId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId,
            String relatedType,
            UUID relatedId
    ) {
        RelationSelection explicit = explicitSelection(companyId, contactId, leadId, dealId);
        if (explicit != null) {
            validate(tenantId, explicit);
            return explicit;
        }

        RelationSelection legacy = legacySelection(relatedType, relatedId);
        validate(tenantId, legacy);
        return legacy;
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

    private RelationSelection explicitSelection(UUID companyId, UUID contactId, UUID leadId, UUID dealId) {
        int count = countNonNull(companyId, contactId, leadId, dealId);
        if (count == 0) {
            return null;
        }
        if (count > 1) {
            throw new IllegalArgumentException("Exactly one CRM relation must be provided.");
        }

        if (companyId != null) {
            return RelationSelection.company(companyId);
        }
        if (contactId != null) {
            return RelationSelection.contact(contactId);
        }
        if (leadId != null) {
            return RelationSelection.lead(leadId);
        }
        return RelationSelection.deal(dealId);
    }

    private RelationSelection legacySelection(String relatedType, UUID relatedId) {
        if (relatedId == null || relatedType == null || relatedType.isBlank()) {
            throw new IllegalArgumentException("A CRM relation is required.");
        }

        return switch (relatedType.trim().toUpperCase()) {
            case "COMPANY" -> RelationSelection.company(relatedId);
            case "CONTACT" -> RelationSelection.contact(relatedId);
            case "LEAD" -> RelationSelection.lead(relatedId);
            case "DEAL" -> RelationSelection.deal(relatedId);
            default -> throw new IllegalArgumentException("Unsupported CRM relation type: " + relatedType);
        };
    }

    private void validate(UUID tenantId, RelationSelection relation) {
        switch (relation.relatedType()) {
            case "COMPANY" -> companyService.requireActiveCompany(tenantId, relation.relatedId());
            case "CONTACT" -> contactRepository.findByIdAndTenantId(relation.relatedId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));
            case "LEAD" -> leadRepository.findByIdAndTenantId(relation.relatedId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found."));
            case "DEAL" -> dealRepository.findByIdAndTenantId(relation.relatedId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Deal not found."));
            default -> throw new IllegalArgumentException("Unsupported CRM relation type: " + relation.relatedType());
        }
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
            UUID relatedId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId
    ) {

        public static RelationSelection company(UUID companyId) {
            return new RelationSelection("COMPANY", companyId, companyId, null, null, null);
        }

        public static RelationSelection contact(UUID contactId) {
            return new RelationSelection("CONTACT", contactId, null, contactId, null, null);
        }

        public static RelationSelection lead(UUID leadId) {
            return new RelationSelection("LEAD", leadId, null, null, leadId, null);
        }

        public static RelationSelection deal(UUID dealId) {
            return new RelationSelection("DEAL", dealId, null, null, null, dealId);
        }
    }
}
