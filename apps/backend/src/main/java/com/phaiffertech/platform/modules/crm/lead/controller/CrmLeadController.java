package com.phaiffertech.platform.modules.crm.lead.controller;

import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadCreateRequest;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadResponse;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadUpdateRequest;
import com.phaiffertech.platform.modules.crm.lead.service.CrmLeadService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/leads")
public class CrmLeadController {

    private final CrmLeadService service;

    public CrmLeadController(CrmLeadService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("crm.lead.read")
    public ApiResponse<PageResponseDto<CrmLeadResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) UUID assignedUserId
    ) {
        return ApiResponse.success(service.list(pageRequest, status, source, assignedUserId));
    }

    @PostMapping
    @RequirePermission("crm.lead.create")
    public ApiResponse<CrmLeadResponse> create(@Valid @RequestBody CrmLeadCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.lead.update")
    public ApiResponse<CrmLeadResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmLeadUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.lead.read")
    public ApiResponse<CrmLeadResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.lead.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("crm.lead.delete")
    public ApiResponse<CrmLeadResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}
