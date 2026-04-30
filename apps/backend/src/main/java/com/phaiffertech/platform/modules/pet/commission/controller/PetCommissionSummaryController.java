package com.phaiffertech.platform.modules.pet.commission.controller;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.modules.pet.commission.dto.PetCommissionSummaryResponse;
import com.phaiffertech.platform.modules.pet.commission.service.PetCommissionSummaryService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/commissions")
@RequirePermission(anyEntitlements = {
        TenantEntitlementKeys.PET_AESTHETICS,
        TenantEntitlementKeys.PET_CLINIC
})
public class PetCommissionSummaryController {

    private final PetCommissionSummaryService service;

    public PetCommissionSummaryController(PetCommissionSummaryService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @RequirePermission("pet.commission.read")
    public ApiResponse<PetCommissionSummaryResponse> summary(
            @RequestParam(required = false) Instant scheduledFrom,
            @RequestParam(required = false) Instant scheduledTo
    ) {
        return ApiResponse.success(service.summary(scheduledFrom, scheduledTo));
    }
}
