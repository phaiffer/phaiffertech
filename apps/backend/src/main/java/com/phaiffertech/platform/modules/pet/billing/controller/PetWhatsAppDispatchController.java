package com.phaiffertech.platform.modules.pet.billing.controller;

import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.modules.pet.billing.dto.PlanRenewalDispatchRequest;
import com.phaiffertech.platform.modules.pet.billing.dto.PetReadyDispatchRequest;
import com.phaiffertech.platform.modules.pet.billing.service.PetReadyMessageDispatchService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages/whatsapp")
public class PetWhatsAppDispatchController {

    private final PetReadyMessageDispatchService petReadyMessageDispatchService;

    public PetWhatsAppDispatchController(PetReadyMessageDispatchService petReadyMessageDispatchService) {
        this.petReadyMessageDispatchService = petReadyMessageDispatchService;
    }

    @PostMapping("/pet-ready")
    @RequirePermission(value = "pet.appointment.update", anyEntitlements = {TenantEntitlementKeys.PET_AESTHETICS})
    public ApiResponse<MessageDispatchResponse> dispatchPetReady(
            @Valid @RequestBody PetReadyDispatchRequest request
    ) {
        return ApiResponse.success(petReadyMessageDispatchService.dispatchPetReady(request.appointmentId()));
    }

    @PostMapping("/plan-renewal")
    @RequirePermission(value = "pet.plan.read", anyEntitlements = {TenantEntitlementKeys.PET_AESTHETICS})
    public ApiResponse<MessageDispatchResponse> dispatchPlanRenewal(
            @Valid @RequestBody PlanRenewalDispatchRequest request
    ) {
        return ApiResponse.success(petReadyMessageDispatchService.dispatchPlanRenewal(request.planId()));
    }
}
