package com.phaiffertech.platform.core.tenant.plan;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class PlanResolutionService {

    public static final String DEFAULT_PLAN_CODE = PlanDefinition.STANDARD.getCode();

    public String normalizePlanCode(String planCode, String fallbackPlanCode) {
        String candidate = normalizeValue(planCode);
        if (candidate == null) {
            candidate = normalizeValue(fallbackPlanCode);
        }
        if (candidate == null) {
            candidate = DEFAULT_PLAN_CODE;
        }

        return resolve(candidate).getCode();
    }

    public PlanDefinition resolve(String planCode) {
        String normalizedCode = normalizeValue(planCode);
        if (normalizedCode == null) {
            return PlanDefinition.STANDARD;
        }

        return Arrays.stream(PlanDefinition.values())
                .filter(planDefinition -> planDefinition.getCode().equals(normalizedCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan code: " + normalizedCode));
    }

    public ProductPackageDefinition resolveProductPackage(String packageCode) {
        String normalizedCode = normalizeValue(packageCode);
        if (normalizedCode == null) {
            throw new IllegalArgumentException("Unknown product package: " + packageCode);
        }

        return Arrays.stream(ProductPackageDefinition.values())
                .filter(productPackageDefinition -> productPackageDefinition.getCode().equals(normalizedCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown product package: " + normalizedCode));
    }

    public List<ProductPackageDefinition> supportedProductPackages() {
        return List.of(ProductPackageDefinition.values());
    }

    private String normalizeValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
