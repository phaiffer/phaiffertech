package com.phaiffertech.platform.core.module.controller;

import com.phaiffertech.platform.core.module.service.ModuleRegistryService;
import com.phaiffertech.platform.core.module.dto.ModuleViewResponse;
import com.phaiffertech.platform.shared.response.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/modules")
public class ModuleRegistryController {

    private final ModuleRegistryService moduleRegistryService;

    public ModuleRegistryController(ModuleRegistryService moduleRegistryService) {
        this.moduleRegistryService = moduleRegistryService;
    }

    @GetMapping
    public ApiResponse<List<ModuleViewResponse>> list() {
        return ApiResponse.success(moduleRegistryService.listEnabledModulesForTenant());
    }
}
