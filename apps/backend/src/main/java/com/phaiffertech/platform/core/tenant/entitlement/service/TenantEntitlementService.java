package com.phaiffertech.platform.core.tenant.entitlement.service;

import com.phaiffertech.platform.core.tenant.entitlement.domain.TenantFeatureEntitlement;
import com.phaiffertech.platform.core.tenant.entitlement.repository.TenantFeatureEntitlementRepository;
import com.phaiffertech.platform.core.tenant.plan.PlanDefinition;
import com.phaiffertech.platform.core.tenant.plan.PlanResolutionService;
import com.phaiffertech.platform.core.tenant.service.TenantContractGrantSource;
import com.phaiffertech.platform.shared.security.LocalDevelopmentAdministratorAccessService;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantEntitlementService {

    private final TenantFeatureEntitlementRepository tenantFeatureEntitlementRepository;
    private final PlanResolutionService planResolutionService;
    private final LocalDevelopmentAdministratorAccessService localDevelopmentAdministratorAccessService;

    public TenantEntitlementService(
            TenantFeatureEntitlementRepository tenantFeatureEntitlementRepository,
            PlanResolutionService planResolutionService,
            LocalDevelopmentAdministratorAccessService localDevelopmentAdministratorAccessService
    ) {
        this.tenantFeatureEntitlementRepository = tenantFeatureEntitlementRepository;
        this.planResolutionService = planResolutionService;
        this.localDevelopmentAdministratorAccessService = localDevelopmentAdministratorAccessService;
    }

    @Transactional
    public void syncManualEntitlements(UUID tenantId, String planCode, List<String> manualEntitlements) {
        PlanDefinition planDefinition = planResolutionService.resolve(planCode);
        Set<String> manualKeys = normalizeFeatureEntitlements(manualEntitlements);
        Set<String> planKeys = new LinkedHashSet<>(planDefinition.getDefaultEntitlements());
        Set<String> allKeys = new LinkedHashSet<>(planKeys);
        allKeys.addAll(manualKeys);

        Map<String, TenantFeatureEntitlement> activeByFeatureKey = tenantFeatureEntitlementRepository
                .findAllByTenantIdAndDeletedAtIsNullOrderByFeatureKeyAsc(tenantId)
                .stream()
                .collect(Collectors.toMap(
                        entitlement -> entitlement.getFeatureKey().toLowerCase(Locale.ROOT),
                        Function.identity(),
                        (left, right) -> left
                ));

        for (String featureKey : allKeys) {
            TenantFeatureEntitlement entitlement = tenantFeatureEntitlementRepository.findByTenantIdAndFeatureKey(tenantId, featureKey)
                    .orElseGet(TenantFeatureEntitlement::new);
            boolean planEnabled = planKeys.contains(featureKey);
            boolean manualEnabled = manualKeys.contains(featureKey);
            String source = TenantContractGrantSource.resolve(planEnabled, manualEnabled);

            entitlement.setTenantId(tenantId);
            entitlement.setFeatureKey(featureKey);
            entitlement.setEnabled(true);
            entitlement.setSource(source == null ? entitlement.getSource() : source);
            entitlement.setDeletedAt(null);
            tenantFeatureEntitlementRepository.save(entitlement);
        }

        for (TenantFeatureEntitlement entitlement : activeByFeatureKey.values()) {
            if (allKeys.contains(entitlement.getFeatureKey().toLowerCase(Locale.ROOT)) && entitlement.isEnabled()) {
                continue;
            }

            if (!entitlement.isEnabled()) {
                continue;
            }

            entitlement.setEnabled(false);
            tenantFeatureEntitlementRepository.save(entitlement);
        }
    }

    @Transactional(readOnly = true)
    public boolean hasEntitlement(UUID tenantId, String requiredEntitlement) {
        String normalizedRequiredEntitlement = normalizeFeatureEntitlement(requiredEntitlement);
        if (normalizedRequiredEntitlement == null) {
            return true;
        }

        if (localDevelopmentAdministratorAccessService.isEnabledForCurrentUser()) {
            return true;
        }

        return tenantFeatureEntitlementRepository.findAllByTenantIdAndDeletedAtIsNullOrderByFeatureKeyAsc(tenantId).stream()
                .filter(TenantFeatureEntitlement::isEnabled)
                .map(TenantFeatureEntitlement::getFeatureKey)
                .map(this::normalizeFeatureEntitlement)
                .filter(featureKey -> featureKey != null)
                .anyMatch(grantedEntitlement -> matches(grantedEntitlement, normalizedRequiredEntitlement));
    }

    @Transactional(readOnly = true)
    public List<String> resolveEffectiveEntitlements(UUID tenantId) {
        return resolveEffectiveEntitlements(tenantId, null);
    }

    @Transactional(readOnly = true)
    public List<String> resolveEffectiveEntitlements(UUID tenantId, String email) {
        List<String> effectiveEntitlements = tenantFeatureEntitlementRepository.findAllByTenantIdAndDeletedAtIsNullOrderByFeatureKeyAsc(tenantId).stream()
                .filter(TenantFeatureEntitlement::isEnabled)
                .map(TenantFeatureEntitlement::getFeatureKey)
                .map(featureKey -> featureKey.toLowerCase(Locale.ROOT))
                .distinct()
                .sorted()
                .toList();

        if (!localDevelopmentAdministratorAccessService.isEnabledForEmail(email)
                && !localDevelopmentAdministratorAccessService.isEnabledForCurrentUser()) {
            return effectiveEntitlements;
        }

        return withWildcardAccess(effectiveEntitlements);
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<String>> resolveManualEntitlements(Collection<UUID> tenantIds) {
        if (tenantIds.isEmpty()) {
            return Map.of();
        }

        return tenantFeatureEntitlementRepository.findAllByTenantIdInAndDeletedAtIsNullAndEnabledTrue(tenantIds).stream()
                .filter(entitlement -> TenantContractGrantSource.includesManual(entitlement.getSource()))
                .collect(Collectors.groupingBy(
                        TenantFeatureEntitlement::getTenantId,
                        Collectors.mapping(
                                TenantFeatureEntitlement::getFeatureKey,
                                Collectors.collectingAndThen(Collectors.toList(), featureKeys -> featureKeys.stream()
                                        .map(featureKey -> featureKey.toLowerCase(Locale.ROOT))
                                        .sorted(Comparator.naturalOrder())
                                        .toList())
                        )
                ));
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<String>> resolveEffectiveEntitlements(Collection<UUID> tenantIds) {
        if (tenantIds.isEmpty()) {
            return Map.of();
        }

        return tenantFeatureEntitlementRepository.findAllByTenantIdInAndDeletedAtIsNullAndEnabledTrue(tenantIds).stream()
                .collect(Collectors.groupingBy(
                        TenantFeatureEntitlement::getTenantId,
                        Collectors.mapping(
                                TenantFeatureEntitlement::getFeatureKey,
                                Collectors.collectingAndThen(Collectors.toList(), featureKeys -> featureKeys.stream()
                                        .map(featureKey -> featureKey.toLowerCase(Locale.ROOT))
                                        .sorted(Comparator.naturalOrder())
                                        .toList())
                        )
                ));
    }

    public Set<String> normalizeFeatureEntitlements(List<String> featureEntitlements) {
        if (featureEntitlements == null) {
            return Set.of();
        }

        return featureEntitlements.stream()
                .map(this::normalizeFeatureEntitlement)
                .filter(featureKey -> featureKey != null)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String normalizeFeatureEntitlement(String featureEntitlement) {
        if (featureEntitlement == null || featureEntitlement.isBlank()) {
            return null;
        }
        return featureEntitlement.trim().toLowerCase(Locale.ROOT);
    }

    private boolean matches(String grantedEntitlement, String requiredEntitlement) {
        if ("*".equals(grantedEntitlement) || grantedEntitlement.equals(requiredEntitlement)) {
            return true;
        }

        if (matchesNamespaceGrant(grantedEntitlement, requiredEntitlement, ".full")) {
            return true;
        }

        return matchesNamespaceGrant(grantedEntitlement, requiredEntitlement, ".basic");
    }

    private boolean matchesNamespaceGrant(String grantedEntitlement, String requiredEntitlement, String suffix) {
        if (!grantedEntitlement.endsWith(suffix)) {
            return false;
        }

        String namespace = grantedEntitlement.substring(0, grantedEntitlement.length() - suffix.length());
        return requiredEntitlement.startsWith(namespace + ".");
    }

    private List<String> withWildcardAccess(List<String> effectiveEntitlements) {
        Set<String> grants = new LinkedHashSet<>(effectiveEntitlements);
        grants.add("*");
        return grants.stream()
                .map(featureKey -> featureKey.toLowerCase(Locale.ROOT))
                .sorted()
                .toList();
    }
}
