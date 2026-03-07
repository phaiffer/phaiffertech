package com.phaiffertech.platform.modules.crm.pipeline.controller;

import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageCreateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageResponse;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageUpdateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.service.CrmPipelineService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/pipeline-stages")
public class CrmPipelineController {

    private final CrmPipelineService service;

    public CrmPipelineController(CrmPipelineService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("crm.pipeline.read")
    public ApiResponse<PageResponseDto<CrmPipelineStageResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.pipeline.read")
    public ApiResponse<CrmPipelineStageResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("crm.pipeline.create")
    public ApiResponse<CrmPipelineStageResponse> create(@Valid @RequestBody CrmPipelineStageCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.pipeline.update")
    public ApiResponse<CrmPipelineStageResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmPipelineStageUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.pipeline.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
