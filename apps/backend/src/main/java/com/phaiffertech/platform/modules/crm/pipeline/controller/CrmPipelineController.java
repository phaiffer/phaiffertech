package com.phaiffertech.platform.modules.crm.pipeline.controller;

import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineCreateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineResponse;
import com.phaiffertech.platform.modules.crm.pipeline.service.CrmPipelineService;
import com.phaiffertech.platform.shared.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/pipelines")
public class CrmPipelineController {

    private final CrmPipelineService service;

    public CrmPipelineController(CrmPipelineService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR','VIEWER')")
    public ApiResponse<List<CrmPipelineResponse>> list() {
        return ApiResponse.success(service.list());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmPipelineResponse> create(@Valid @RequestBody CrmPipelineCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }
}
