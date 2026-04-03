package com.phaiffertech.platform.modules.pet.servicecatalog.service;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetServiceCatalogCategoryPolicyService {

    private final TenantEntitlementService tenantEntitlementService;

    public PetServiceCatalogCategoryPolicyService(TenantEntitlementService tenantEntitlementService) {
        this.tenantEntitlementService = tenantEntitlementService;
    }

    @Transactional(readOnly = true)
    public Set<PetServiceCategory> resolveAllowedCategories(UUID tenantId) {
        EnumSet<PetServiceCategory> categories = EnumSet.noneOf(PetServiceCategory.class);

        if (tenantEntitlementService.hasEntitlement(tenantId, TenantEntitlementKeys.PET_AESTHETICS)) {
            categories.add(PetServiceCategory.GROOMING);
        }

        if (tenantEntitlementService.hasEntitlement(tenantId, TenantEntitlementKeys.PET_CLINIC)
                || tenantEntitlementService.hasEntitlement(tenantId, TenantEntitlementKeys.PET_VETERINARY)) {
            categories.add(PetServiceCategory.CLINICAL);
        }

        return categories;
    }

    @Transactional(readOnly = true)
    public boolean canUseCategory(UUID tenantId, PetServiceCategory category) {
        return resolveAllowedCategories(tenantId).contains(category);
    }

    @Transactional(readOnly = true)
    public void validateCategoryAccess(UUID tenantId, PetServiceCategory category) {
        if (canUseCategory(tenantId, category)) {
            return;
        }

        throw new ConflictOperationException(
                "Pet service category is not available for the current tenant package."
        );
    }
}
