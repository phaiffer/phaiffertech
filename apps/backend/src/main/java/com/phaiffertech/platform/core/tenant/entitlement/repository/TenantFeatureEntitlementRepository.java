package com.phaiffertech.platform.core.tenant.entitlement.repository;

import com.phaiffertech.platform.core.tenant.entitlement.domain.TenantFeatureEntitlement;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantFeatureEntitlementRepository extends JpaRepository<TenantFeatureEntitlement, UUID> {

    List<TenantFeatureEntitlement> findAllByTenantIdAndDeletedAtIsNullOrderByFeatureKeyAsc(UUID tenantId);

    List<TenantFeatureEntitlement> findAllByTenantIdInAndDeletedAtIsNullAndEnabledTrue(Collection<UUID> tenantIds);

    Optional<TenantFeatureEntitlement> findByTenantIdAndFeatureKey(UUID tenantId, String featureKey);
}
