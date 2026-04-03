package com.phaiffertech.platform.core.tenant.entitlement;

import java.util.List;

public final class TenantEntitlementKeys {

    public static final String CRM_BASIC = "crm.basic";
    public static final String CRM_FULL = "crm.full";
    public static final String PET_BASIC = "pet.basic";
    public static final String PET_FULL = "pet.full";
    public static final String PET_AESTHETICS = "pet.aesthetics";
    public static final String PET_CLINIC = "pet.clinic";
    public static final String PET_RETAIL = "pet.retail";
    public static final String PET_VETERINARY = "pet.veterinary";
    public static final String FINANCE_FISCAL = "finance.fiscal";
    public static final String ANY = "*";

    public static final List<String> PET_SUBMODULES = List.of(
            PET_AESTHETICS,
            PET_CLINIC,
            PET_RETAIL,
            PET_VETERINARY
    );

    public static final List<String> PET_OPERATIONAL_SUBMODULES = List.of(
            PET_AESTHETICS,
            PET_CLINIC
    );

    public static final List<String> PET_RETAIL_SUBMODULES = List.of(PET_RETAIL);
    public static final List<String> PET_CLINICAL_SUBMODULES = List.of(PET_VETERINARY);

    private TenantEntitlementKeys() {
    }
}
