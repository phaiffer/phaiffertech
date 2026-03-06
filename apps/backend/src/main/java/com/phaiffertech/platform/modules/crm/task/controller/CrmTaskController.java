package com.phaiffertech.platform.modules.crm.task.controller;

import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskCreateRequest;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskResponse;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskUpdateRequest;
import com.phaiffertech.platform.modules.crm.task.service.CrmTaskService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/tasks")
public class CrmTaskController {

    private final CrmTaskService service;

    public CrmTaskController(CrmTaskService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR','VIEWER')")
    public ApiResponse<PageResponseDto<CrmTaskResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmTaskResponse> create(@Valid @RequestBody CrmTaskCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmTaskResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmTaskUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }
}
