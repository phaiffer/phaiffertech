package com.phaiffertech.platform.core.finance.controller;

import com.phaiffertech.platform.core.finance.fiscal.dto.TenantFiscalProfileResponse;
import com.phaiffertech.platform.core.finance.fiscal.dto.TenantFiscalProfileUpsertRequest;
import com.phaiffertech.platform.core.finance.fiscal.service.TenantFiscalProfileService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance/fiscal-profile")
public class FinanceFiscalProfileController {

    private final TenantFiscalProfileService service;

    public FinanceFiscalProfileController(TenantFiscalProfileService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.invoice.read")
    public ApiResponse<TenantFiscalProfileResponse> getCurrentTenantProfile() {
        return ApiResponse.success(service.getCurrentTenantProfile());
    }

    @PutMapping
    @RequirePermission("finance.invoice.update")
    public ApiResponse<TenantFiscalProfileResponse> upsertCurrentTenantProfile(
            @Valid @RequestBody TenantFiscalProfileUpsertRequest request
    ) {
        return ApiResponse.success(service.upsertCurrentTenantProfile(request));
    }
}
