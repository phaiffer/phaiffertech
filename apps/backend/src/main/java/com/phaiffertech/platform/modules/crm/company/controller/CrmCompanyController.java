package com.phaiffertech.platform.modules.crm.company.controller;

import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyCreateRequest;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyResponse;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyUpdateRequest;
import com.phaiffertech.platform.modules.crm.company.service.CrmCompanyService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/companies")
public class CrmCompanyController {

    private final CrmCompanyService service;

    public CrmCompanyController(CrmCompanyService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("crm.company.read")
    public ApiResponse<PageResponseDto<CrmCompanyResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID ownerUserId
    ) {
        return ApiResponse.success(service.list(pageRequest, status, ownerUserId));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.company.read")
    public ApiResponse<CrmCompanyResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("crm.company.create")
    public ApiResponse<CrmCompanyResponse> create(@Valid @RequestBody CrmCompanyCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.company.update")
    public ApiResponse<CrmCompanyResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmCompanyUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.company.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
