package com.phaiffertech.platform.core.module.featureflag.service;

import com.phaiffertech.platform.core.module.featureflag.dto.FeatureFlagViewResponse;
import com.phaiffertech.platform.core.module.featureflag.repository.FeatureFlagRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;

    public FeatureFlagService(FeatureFlagRepository featureFlagRepository) {
        this.featureFlagRepository = featureFlagRepository;
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(String flagKey, UUID tenantId) {
        return featureFlagRepository.findByFlagKeyAndTenantIdAndDeletedAtIsNull(flagKey, tenantId)
                .map(flag -> flag.isEnabled())
                .orElseGet(() -> featureFlagRepository.findByFlagKeyAndTenantIdIsNullAndDeletedAtIsNull(flagKey)
                        .map(flag -> flag.isEnabled())
                        .orElse(true));
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> resolveFlagsForTenant(UUID tenantId) {
        Map<String, Boolean> mergedFlags = new LinkedHashMap<>();
        featureFlagRepository.findAllByTenantIdIsNullAndDeletedAtIsNull()
                .forEach(flag -> mergedFlags.put(flag.getFlagKey(), flag.isEnabled()));
        featureFlagRepository.findAllByTenantIdAndDeletedAtIsNull(tenantId)
                .forEach(flag -> mergedFlags.put(flag.getFlagKey(), flag.isEnabled()));
        return mergedFlags;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagViewResponse> listForCurrentTenant() {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Map<String, Boolean> mergedFlags = resolveFlagsForTenant(tenantId);

        List<FeatureFlagViewResponse> result = new ArrayList<>();
        mergedFlags.forEach((key, enabled) -> {
            boolean tenantOverride = featureFlagRepository.findByFlagKeyAndTenantIdAndDeletedAtIsNull(key, tenantId).isPresent();
            result.add(new FeatureFlagViewResponse(key, enabled, tenantOverride ? "TENANT" : "GLOBAL"));
        });
        return result;
    }
}
