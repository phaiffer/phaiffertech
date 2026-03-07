package com.phaiffertech.platform.modules.crm.activity.controller;

import com.phaiffertech.platform.modules.crm.activity.dto.CrmActivityResponse;
import com.phaiffertech.platform.modules.crm.activity.service.CrmActivityService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/activity")
public class CrmActivityController {

    private final CrmActivityService service;

    public CrmActivityController(CrmActivityService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("crm.activity.read")
    public ApiResponse<PageResponseDto<CrmActivityResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }
}
