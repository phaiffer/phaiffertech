package com.phaiffertech.platform.modules.crm.company.mapper;

import com.phaiffertech.platform.modules.crm.company.domain.CrmCompany;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyCreateRequest;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyResponse;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyUpdateRequest;

public final class CrmCompanyMapper {

    private CrmCompanyMapper() {
    }

    public static CrmCompany toEntity(CrmCompanyCreateRequest request) {
        CrmCompany company = new CrmCompany();
        apply(company, request.name(), request.legalName(), request.document(), request.email(), request.phone(),
                request.website(), request.industry(), request.status(), request.ownerUserId());
        return company;
    }

    public static void apply(CrmCompany company, CrmCompanyUpdateRequest request) {
        apply(company, request.name(), request.legalName(), request.document(), request.email(), request.phone(),
                request.website(), request.industry(), request.status(), request.ownerUserId());
    }

    private static void apply(
            CrmCompany company,
            String name,
            String legalName,
            String document,
            String email,
            String phone,
            String website,
            String industry,
            String status,
            java.util.UUID ownerUserId
    ) {
        company.setName(name.trim());
        company.setLegalName(normalize(legalName));
        company.setDocument(normalize(document));
        company.setEmail(normalize(email));
        company.setPhone(normalize(phone));
        company.setWebsite(normalize(website));
        company.setIndustry(normalize(industry));
        company.setStatus(resolveStatus(status));
        company.setOwnerUserId(ownerUserId);
    }

    public static CrmCompanyResponse toResponse(CrmCompany company) {
        return new CrmCompanyResponse(
                company.getId(),
                company.getName(),
                company.getLegalName(),
                company.getDocument(),
                company.getEmail(),
                company.getPhone(),
                company.getWebsite(),
                company.getIndustry(),
                company.getStatus(),
                company.getOwnerUserId(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }

    private static String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
