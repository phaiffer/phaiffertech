package com.phaiffertech.platform.core.finance.controller;

import com.phaiffertech.platform.core.finance.fiscal.dto.FinanceFiscalReadinessResponse;
import com.phaiffertech.platform.core.finance.fiscal.service.FinanceFiscalReadinessService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance/invoices")
public class FinanceFiscalReadinessController {

    private final FinanceFiscalReadinessService service;

    public FinanceFiscalReadinessController(FinanceFiscalReadinessService service) {
        this.service = service;
    }

    @GetMapping("/{id}/fiscal-readiness")
    @RequirePermission("finance.invoice.read")
    public ApiResponse<FinanceFiscalReadinessResponse> assessInvoice(@PathVariable UUID id) {
        return ApiResponse.success(service.assessCurrentTenantInvoice(id));
    }
}
