package com.phaiffertech.platform.modules.pet.medical.timeline.controller;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.modules.pet.medical.timeline.dto.PetClinicalTimelineResponse;
import com.phaiffertech.platform.modules.pet.medical.timeline.service.PetClinicalTimelineService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pet/medical/timeline")
@RequirePermission(entitlement = TenantEntitlementKeys.PET_VETERINARY)
public class PetClinicalTimelineController {

    private final PetClinicalTimelineService service;

    public PetClinicalTimelineController(PetClinicalTimelineService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("pet.medical-record.read")
    public ApiResponse<PetClinicalTimelineResponse> getTimeline(
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) UUID appointmentId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ApiResponse.success(service.getTimeline(petId, appointmentId, limit));
    }
}
