package com.phaiffertech.platform.modules.crm.task.controller;

import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskCreateRequest;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskResponse;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskUpdateRequest;
import com.phaiffertech.platform.modules.crm.task.service.CrmTaskService;
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
@RequestMapping("/api/v1/crm/tasks")
public class CrmTaskController {

    private final CrmTaskService service;

    public CrmTaskController(CrmTaskService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("crm.task.read")
    public ApiResponse<PageResponseDto<CrmTaskResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID assignedUserId,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID contactId,
            @RequestParam(required = false) UUID leadId,
            @RequestParam(required = false) UUID dealId
    ) {
        return ApiResponse.success(service.list(pageRequest, status, priority, assignedUserId, companyId, contactId, leadId, dealId));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.task.read")
    public ApiResponse<CrmTaskResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("crm.task.create")
    public ApiResponse<CrmTaskResponse> create(@Valid @RequestBody CrmTaskCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.task.update")
    public ApiResponse<CrmTaskResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmTaskUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.task.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
