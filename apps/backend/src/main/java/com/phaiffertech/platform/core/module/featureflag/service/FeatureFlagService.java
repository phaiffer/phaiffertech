package com.phaiffertech.platform.core.module.featureflag.service;

import com.phaiffertech.platform.core.module.featureflag.dto.FeatureFlagViewResponse;
import com.phaiffertech.platform.core.module.featureflag.domain.FeatureFlag;
import com.phaiffertech.platform.core.module.featureflag.repository.FeatureFlagRepository;
import com.phaiffertech.platform.core.module.service.ModuleCatalogCacheService;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.tenant.service.PlatformAccessService;
import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.ArrayList;
import java.time.Instant;
import java.util.Comparator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final TenantRepository tenantRepository;
    private final PlatformAccessService platformAccessService;
    private final AuditLogService auditLogService;
    private final PlatformMetricsService platformMetricsService;
    private final ModuleCatalogCacheService moduleCatalogCacheService;
    private final ConcurrentMap<FlagLookupKey, Optional<Boolean>> flagStateCache = new ConcurrentHashMap<>();

    public FeatureFlagService(
            FeatureFlagRepository featureFlagRepository,
            TenantRepository tenantRepository,
            PlatformAccessService platformAccessService,
            AuditLogService auditLogService,
            PlatformMetricsService platformMetricsService,
            ModuleCatalogCacheService moduleCatalogCacheService
    ) {
        this.featureFlagRepository = featureFlagRepository;
        this.tenantRepository = tenantRepository;
        this.platformAccessService = platformAccessService;
        this.auditLogService = auditLogService;
        this.platformMetricsService = platformMetricsService;
        this.moduleCatalogCacheService = moduleCatalogCacheService;
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(String flagKey, UUID tenantId) {
        return isEnabled(flagKey, tenantId, true);
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(String flagKey, UUID tenantId, boolean defaultEnabled) {
        String normalizedFlagKey = normalizeFlagKey(flagKey);
        if (normalizedFlagKey == null) {
            return defaultEnabled;
        }

        return flagStateCache.computeIfAbsent(new FlagLookupKey(normalizedFlagKey, tenantId), this::loadEffectiveValue)
                .orElse(defaultEnabled);
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> resolveFlagsForTenant(UUID tenantId) {
        Map<String, Boolean> mergedFlags = new LinkedHashMap<>();
        featureFlagRepository.findAllByTenantIdIsNullAndDeletedAtIsNull()
                .forEach(flag -> mergedFlags.put(normalizeFlagKey(flag.getFlagKey()), flag.isEnabled()));
        featureFlagRepository.findAllByTenantIdAndDeletedAtIsNull(tenantId)
                .forEach(flag -> mergedFlags.put(normalizeFlagKey(flag.getFlagKey()), flag.isEnabled()));
        return mergedFlags;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagViewResponse> listForCurrentTenant() {
        return listForTenantInternal(TenantContext.getRequiredTenantId());
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagViewResponse> listForTenant(UUID tenantId) {
        platformAccessService.assertPlatformAdministrationAccess();
        assertTenantExists(tenantId);
        return listForTenantInternal(tenantId);
    }

    @Transactional
    public FeatureFlagViewResponse setTenantOverride(UUID tenantId, String flagKey, boolean enabled) {
        platformAccessService.assertPlatformAdministrationAccess();
        assertTenantExists(tenantId);

        String normalizedFlagKey = requireFlagKey(flagKey);
        FeatureFlag featureFlag = featureFlagRepository.findByFlagKeyAndTenantId(normalizedFlagKey, tenantId)
                .orElseGet(FeatureFlag::new);
        featureFlag.setFlagKey(normalizedFlagKey);
        featureFlag.setTenantId(tenantId);
        featureFlag.setEnabled(enabled);
        featureFlag.setDeletedAt(null);
        featureFlagRepository.save(featureFlag);

        invalidateCache(normalizedFlagKey, tenantId);
        moduleCatalogCacheService.evict(tenantId);
        platformMetricsService.recordFeatureFlagMutation("upsert");
        auditLogService.logCurrentUserEvent(
                tenantId,
                AuditActionType.UPDATE.name(),
                "feature_flag",
                normalizedFlagKey,
                Map.of(
                        "scope", "TENANT",
                        "enabled", enabled
                )
        );

        return resolveFlagView(normalizedFlagKey, tenantId);
    }

    @Transactional
    public void clearTenantOverride(UUID tenantId, String flagKey) {
        platformAccessService.assertPlatformAdministrationAccess();
        assertTenantExists(tenantId);

        String normalizedFlagKey = requireFlagKey(flagKey);
        featureFlagRepository.findByFlagKeyAndTenantId(normalizedFlagKey, tenantId).ifPresent(featureFlag -> {
            featureFlag.setDeletedAt(Instant.now());
            featureFlagRepository.save(featureFlag);
            platformMetricsService.recordFeatureFlagMutation("clear");
            auditLogService.logCurrentUserEvent(
                    tenantId,
                    AuditActionType.UPDATE.name(),
                    "feature_flag",
                    normalizedFlagKey,
                    Map.of(
                            "scope", "TENANT",
                            "overrideCleared", true
                    )
            );
        });

        invalidateCache(normalizedFlagKey, tenantId);
        moduleCatalogCacheService.evict(tenantId);
    }

    private List<FeatureFlagViewResponse> listForTenantInternal(UUID tenantId) {
        Map<String, Boolean> mergedFlags = resolveFlagsForTenant(tenantId);
        Map<String, Boolean> tenantOverrides = featureFlagRepository.findAllByTenantIdAndDeletedAtIsNull(tenantId).stream()
                .collect(LinkedHashMap::new, (map, flag) -> map.put(normalizeFlagKey(flag.getFlagKey()), flag.isEnabled()), Map::putAll);

        List<FeatureFlagViewResponse> result = new ArrayList<>();
        mergedFlags.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.naturalOrder()))
                .forEach(entry -> result.add(new FeatureFlagViewResponse(
                        entry.getKey(),
                        entry.getValue(),
                        tenantOverrides.containsKey(entry.getKey()) ? "TENANT" : "GLOBAL"
                )));
        return result;
    }

    private Optional<Boolean> loadEffectiveValue(FlagLookupKey key) {
        if (key.tenantId() != null) {
            Optional<FeatureFlag> tenantOverride = featureFlagRepository.findByFlagKeyAndTenantIdAndDeletedAtIsNull(key.flagKey(), key.tenantId());
            if (tenantOverride.isPresent()) {
                return Optional.of(tenantOverride.get().isEnabled());
            }
        }

        return featureFlagRepository.findByFlagKeyAndTenantIdIsNullAndDeletedAtIsNull(key.flagKey())
                .map(FeatureFlag::isEnabled);
    }

    private FeatureFlagViewResponse resolveFlagView(String flagKey, UUID tenantId) {
        Optional<FeatureFlag> tenantOverride = featureFlagRepository.findByFlagKeyAndTenantIdAndDeletedAtIsNull(flagKey, tenantId);
        if (tenantOverride.isPresent()) {
            return new FeatureFlagViewResponse(flagKey, tenantOverride.get().isEnabled(), "TENANT");
        }

        boolean enabled = featureFlagRepository.findByFlagKeyAndTenantIdIsNullAndDeletedAtIsNull(flagKey)
                .map(FeatureFlag::isEnabled)
                .orElse(true);
        return new FeatureFlagViewResponse(flagKey, enabled, "GLOBAL");
    }

    private String requireFlagKey(String flagKey) {
        String normalizedFlagKey = normalizeFlagKey(flagKey);
        if (normalizedFlagKey == null) {
            throw new IllegalArgumentException("Feature flag key is required.");
        }
        return normalizedFlagKey;
    }

    private String normalizeFlagKey(String flagKey) {
        if (flagKey == null || flagKey.isBlank()) {
            return null;
        }
        return flagKey.trim().toLowerCase(Locale.ROOT);
    }

    private void invalidateCache(String flagKey, UUID tenantId) {
        flagStateCache.remove(new FlagLookupKey(flagKey, tenantId));
    }

    private void assertTenantExists(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found.");
        }
    }

    private record FlagLookupKey(String flagKey, UUID tenantId) {
    }
}
