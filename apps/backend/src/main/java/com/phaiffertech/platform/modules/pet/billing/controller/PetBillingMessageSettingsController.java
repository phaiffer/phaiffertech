package com.phaiffertech.platform.modules.pet.billing.controller;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.modules.pet.billing.dto.PetBillingMessageSettingsRequest;
import com.phaiffertech.platform.modules.pet.billing.dto.PetBillingMessageSettingsResponse;
import com.phaiffertech.platform.modules.pet.billing.service.PetBillingMessageSettingsService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/billing-message-settings")
@RequirePermission(anyEntitlements = {
        TenantEntitlementKeys.PET_AESTHETICS,
        TenantEntitlementKeys.PET_CLINIC
})
public class PetBillingMessageSettingsController {

    private final PetBillingMessageSettingsService service;

    public PetBillingMessageSettingsController(PetBillingMessageSettingsService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.plan.read")
    public ApiResponse<PetBillingMessageSettingsResponse> get() {
        return ApiResponse.success(service.getCurrentTenantSettings());
    }

    @PutMapping
    @RequirePermission("pet.plan.create")
    public ApiResponse<PetBillingMessageSettingsResponse> update(
            @Valid @RequestBody PetBillingMessageSettingsRequest request
    ) {
        return ApiResponse.success(service.updateCurrentTenantSettings(request));
    }
}
