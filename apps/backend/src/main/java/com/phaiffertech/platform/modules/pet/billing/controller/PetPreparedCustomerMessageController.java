package com.phaiffertech.platform.modules.pet.billing.controller;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.modules.pet.billing.dto.PetPreparedCustomerMessageResponse;
import com.phaiffertech.platform.modules.pet.billing.service.PetBillingMessageSettingsService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/messages")
@RequirePermission(anyEntitlements = {
        TenantEntitlementKeys.PET_AESTHETICS,
        TenantEntitlementKeys.PET_CLINIC
})
public class PetPreparedCustomerMessageController {

    private final PetBillingMessageSettingsService service;

    public PetPreparedCustomerMessageController(PetBillingMessageSettingsService service) {
        this.service = service;
    }

    @GetMapping("/plans/{planId}/renewal-reminder")
    @RequirePermission("pet.plan.read")
    public ApiResponse<PetPreparedCustomerMessageResponse> preparePlanRenewalMessage(@PathVariable UUID planId) {
        return ApiResponse.success(service.preparePlanRenewalMessage(planId));
    }

    @GetMapping("/appointments/{appointmentId}/pickup")
    @RequirePermission("pet.appointment.read")
    public ApiResponse<PetPreparedCustomerMessageResponse> preparePetReadyMessage(@PathVariable UUID appointmentId) {
        return ApiResponse.success(service.preparePetReadyMessage(appointmentId));
    }
}
